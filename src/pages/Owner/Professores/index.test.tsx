/**
 * Os convites de professor, na tela do dono (web#377, api#451).
 *
 * O teste que carrega o arquivo é o do **pendente vencido**. O banco só guarda
 * os quatro estados do enum; "pendente e o prazo passou" não é um deles — é um
 * `PENDING` que o serviço recusa em tempo de leitura. Uma tela que lesse só o
 * `status` mostraria "aguardando resposta" para sempre num convite que ninguém
 * mais consegue aceitar, e o dono nunca saberia que precisa reenviar. É o mesmo
 * convite que some quando alguém filtra por `PENDING` e esquece o prazo.
 *
 * O segundo é o da **ressalva**. Esta lista é o livro de convites, e não a de
 * professores: a api ainda não lista os `PlaceMember` de um espaço (api#461).
 * A tela poderia chamar os aceitos de "professores" e quase sempre acertaria —
 * e afirmaria o que não sabe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/render'
import { professoresService } from '../../../services/professores'
import * as placesService from '../../../services/places'
import OwnerProfessores from './index'
import type { ConviteDeProfessor } from '../../../types/api'

vi.mock('../../../services/professores')
vi.mock('../../../services/places')

const servico = vi.mocked(professoresService)
const espacos = vi.mocked(placesService)

const DIA = 24 * 60 * 60 * 1000

function convite(over: Partial<ConviteDeProfessor> = {}): ConviteDeProfessor {
  return {
    id: 'c1',
    email: 'professor@exemplo.com',
    papel: 'PROFESSOR',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 5 * DIA).toISOString(),
    respondedAt: null,
    createdAt: new Date(Date.now() - 2 * DIA).toISOString(),
    ...over,
  }
}

const monta = () =>
  renderWithProviders(<OwnerProfessores />, {
    route: '/owner/places/ltc/professores',
    path: '/owner/places/:placeId/professores',
  })

beforeEach(() => {
  vi.clearAllMocks()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  espacos.getOne.mockResolvedValue({ data: { success: true, data: { id: 'ltc', name: 'Lavras Tênis Clube' } } } as any)
  servico.convites.mockResolvedValue([])
  servico.convidar.mockResolvedValue(convite({ email: 'nova@exemplo.com' }))
})

describe('OwnerProfessores', () => {
  it('convida por e-mail e recarrega a lista', async () => {
    const { user } = monta()

    await user.type(await screen.findByLabelText('E-mail do professor'), 'nova@exemplo.com')
    await user.click(screen.getByRole('button', { name: /convidar/i }))

    await waitFor(() => expect(servico.convidar).toHaveBeenCalledWith('ltc', 'nova@exemplo.com'))
    // Duas chamadas: a da montagem e a da invalidação depois do convite.
    await waitFor(() => expect(servico.convites.mock.calls.length).toBeGreaterThan(1))
  })

  it('não manda e-mail inválido para a api', async () => {
    const { user } = monta()

    await user.type(await screen.findByLabelText('E-mail do professor'), 'não-é-email')
    await user.click(screen.getByRole('button', { name: /convidar/i }))

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
    expect(servico.convidar).not.toHaveBeenCalled()
  })

  it('separa o pendente vencido do pendente que ainda vale', async () => {
    servico.convites.mockResolvedValue([
      convite({ id: 'vale', email: 'vale@exemplo.com' }),
      convite({
        id: 'venceu',
        email: 'venceu@exemplo.com',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 2 * DIA).toISOString(),
      }),
    ])

    monta()

    // Os dois são PENDING no banco, e a tela precisa dizer coisas diferentes.
    expect(await screen.findByText('Aguardando resposta')).toBeInTheDocument()
    expect(screen.getByText('Venceu sem resposta')).toBeInTheDocument()
  })

  it('mostra os quatro estados do enum', async () => {
    servico.convites.mockResolvedValue([
      convite({ id: '1', email: 'a@x.com', status: 'ACCEPTED', respondedAt: new Date().toISOString() }),
      convite({ id: '2', email: 'b@x.com', status: 'DECLINED', respondedAt: new Date().toISOString() }),
      convite({ id: '3', email: 'c@x.com', status: 'EXPIRED' }),
      convite({ id: '4', email: 'd@x.com' }),
    ])

    monta()

    expect(await screen.findByText('Aceito')).toBeInTheDocument()
    expect(screen.getByText('Recusado')).toBeInTheDocument()
    expect(screen.getByText('Expirado')).toBeInTheDocument()
    expect(screen.getByText('Aguardando resposta')).toBeInTheDocument()
  })

  it('avisa que esta é a lista de convites, e não a de professores', async () => {
    servico.convites.mockResolvedValue([convite({ status: 'ACCEPTED', respondedAt: new Date().toISOString() })])

    monta()

    // Sem a ressalva, "Aceito" leria como "é professor daqui" — e vínculo criado
    // por outro caminho não aparece nesta lista.
    expect(await screen.findByText(/lista de convites, e não a de professores/i)).toBeInTheDocument()
  })

  it('lista que não carrega avisa, em vez de parecer vazia', async () => {
    servico.convites.mockRejectedValue(new Error('500'))

    monta()

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os convites.'),
    )
    // "Nenhum convite ainda" seria mentira: pode haver muitos.
    expect(screen.queryByText(/Nenhum convite ainda/)).not.toBeInTheDocument()
  })
})
