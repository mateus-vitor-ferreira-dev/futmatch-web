/**
 * O formulário de nova solicitação de estabelecimento.
 *
 * Ele nasceu quebrado e ficou assim: pedia `placeName`, `address` e
 * `description`, campos que não existem no `createPlaceRequestSchema` da API.
 * Como o `validate` de lá roda com `stripUnknown`, o corpo enviado se reduzia a
 * `{ city }` e todo envio voltava 422 — o dono só via um erro genérico. Ver
 * #250.
 *
 * Por isso o teste central aqui não é "abre o modal": é **o que sai no corpo do
 * POST**. Se alguém renomear um campo de um lado só, é este teste que cai.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { AxiosResponse } from 'axios'
import { renderWithProviders } from '../../../test/render'
import { envelope, erroDaApi } from '../../../test/factories'
import OwnerRequests from './index'
import type { ApiEnvelope, PlaceRequest } from '../../../types/api'

const assinatura = vi.hoisted(() => ({ isActive: true, loading: false }))

vi.mock('../../../services/placeRequests')
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'owner-1', name: 'Dono', role: 'OWNER' } }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
// O SubscriptionGate deixou de ser mockado na #244: agora ele só avisa, e é
// dele que sai a faixa que o caso de assinatura inativa procura.
// `importOriginal` porque o componente importa `diasDeToleranciaRestantes`
// deste mesmo módulo.
vi.mock('../../../hooks/useSubscription', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../hooks/useSubscription')>()),
  useSubscription: () => ({
    sub: { status: 'active' },
    ...assinatura,
    podeAlterar: assinatura.isActive && !assinatura.loading,
  }),
}))
vi.mock('../../../components/DashboardLayout/pageHeader', () => ({
  usePageHeader: () => {},
  PageActions: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import * as placeRequestsService from '../../../services/placeRequests'

const criar = vi.mocked(placeRequestsService.create)
const listarMinhas = vi.mocked(placeRequestsService.listMine)

/**
 * O serviço devolve a resposta bruta do axios — `res.data.data`. O teste só
 * precisa do corpo, então o resto do AxiosResponse fica de fora.
 */
function resposta<T>(data: T) {
  return { data: envelope(data) } as AxiosResponse<ApiEnvelope<T>>
}

beforeEach(() => {
  vi.clearAllMocks()
  assinatura.isActive = true
  assinatura.loading = false
  listarMinhas.mockResolvedValue(resposta<PlaceRequest[]>([]))
  criar.mockResolvedValue(resposta({} as PlaceRequest))
})

/** Abre o modal e devolve o `user` para continuar a interação. */
async function abreModal() {
  const resultado = renderWithProviders(<OwnerRequests />)
  await waitFor(() => expect(listarMinhas).toHaveBeenCalled())
  await resultado.user.click(screen.getByRole('button', { name: /nova solicitação/i }))
  await screen.findByText('Nova Solicitação de Estabelecimento')
  return resultado
}

/** Preenche todos os obrigatórios com dados válidos. */
async function preencheTudo(user: Awaited<ReturnType<typeof abreModal>>['user']) {
  await user.type(screen.getByLabelText(/nome do estabelecimento/i), 'Arena Verde')
  await user.type(screen.getByLabelText(/^cep/i), '37200430')
  await user.type(screen.getByLabelText(/^rua/i), 'Av. Brasil')
  await user.type(screen.getByLabelText(/^número/i), '123')
  await user.type(screen.getByLabelText(/^bairro/i), 'Centro')
  await user.type(screen.getByLabelText(/^cidade/i), 'Lavras')
  await user.type(screen.getByLabelText(/^uf/i), 'mg')
}

describe('OwnerRequests — formulário de nova solicitação', () => {
  it('envia exatamente os campos que a API espera', async () => {
    const { user } = await abreModal()
    await preencheTudo(user)

    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar).toHaveBeenCalledWith({
      name: 'Arena Verde',
      street: 'Av. Brasil',
      number: '123',
      complement: null,
      neighborhood: 'Centro',
      city: 'Lavras',
      state: 'MG',
      zipCode: '37200-430',
    })
  })

  it('não manda campo que a API descartaria em silêncio', async () => {
    const { user } = await abreModal()
    await preencheTudo(user)

    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    const enviado: Record<string, unknown> = { ...criar.mock.calls[0][0] }
    // Os três da versão quebrada. Se voltarem, o 422 volta junto.
    expect(enviado).not.toHaveProperty('placeName')
    expect(enviado).not.toHaveProperty('address')
    expect(enviado).not.toHaveProperty('description')
  })

  it('não chama a API quando falta campo obrigatório', async () => {
    const { user } = await abreModal()
    await user.type(screen.getByLabelText(/nome do estabelecimento/i), 'Arena Verde')

    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    expect(await screen.findByText('CEP obrigatório')).toBeInTheDocument()
    expect(criar).not.toHaveBeenCalled()
  })

  it('recusa CEP fora do formato antes de gastar uma requisição', async () => {
    const { user } = await abreModal()
    await preencheTudo(user)
    await user.clear(screen.getByLabelText(/^cep/i))
    await user.type(screen.getByLabelText(/^cep/i), '123')

    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    expect(await screen.findByText('CEP no formato 00000-000')).toBeInTheDocument()
    expect(criar).not.toHaveBeenCalled()
  })

  it('mostra a mensagem da API no modal, e não some junto com o toast', async () => {
    const { user } = await abreModal()
    await preencheTudo(user)
    criar.mockRejectedValue(erroDaApi('Estado obrigatório', 422))

    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    expect(await screen.findByText('Estado obrigatório')).toBeInTheDocument()
    // O modal continua aberto, com o que o dono digitou, para ele corrigir.
    expect(screen.getByText('Nova Solicitação de Estabelecimento')).toBeInTheDocument()
  })

  it('manda o complemento quando preenchido', async () => {
    const { user } = await abreModal()
    await preencheTudo(user)
    await user.type(screen.getByLabelText(/^complemento/i), 'quadra 2')

    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][0]).toMatchObject({ complement: 'quadra 2' })
  })
})

/**
 * A #244: esta tela escondia tudo com a assinatura vencida, enquanto o Estoque,
 * na mesma navegação lateral, deixava consultar e só travava a edição. Quem
 * segue o contrato do servidor é o Estoque — `requireActiveSubscription` está
 * só nos verbos de escrita.
 */
describe('OwnerRequests — assinatura inativa', () => {
  it('mantém a consulta e desabilita a nova solicitação', async () => {
    assinatura.isActive = false
    listarMinhas.mockResolvedValue(resposta<PlaceRequest[]>([
      { id: 'req-1', city: 'Lavras', status: 'PENDING' } as PlaceRequest,
    ]))

    renderWithProviders(<OwnerRequests />)

    await waitFor(() => expect(listarMinhas).toHaveBeenCalled())
    expect(screen.getByText(/pode consultar, mas precisa de uma assinatura ativa/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nova solicitação/i })).toBeDisabled()
  })

  it('com assinatura em dia, nada é avisado nem desabilitado', async () => {
    renderWithProviders(<OwnerRequests />)

    await waitFor(() => expect(listarMinhas).toHaveBeenCalled())
    expect(screen.queryByText(/pode consultar, mas precisa/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nova solicitação/i })).toBeEnabled()
  })
})
