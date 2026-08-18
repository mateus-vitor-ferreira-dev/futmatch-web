/**
 * Fluxo crítico: criar uma pelada.
 *
 * É o formulário mais caro de errar do produto: os quatro campos viram o
 * contrato do rateio. Vaga errada faz gente sobrar na quadra, valor errado faz
 * cada um pagar o que não combinou, e chave Pix errada manda o dinheiro do
 * grupo para a conta de outra pessoa.
 *
 * O wizard tem 3 etapas. Os testes entram pela etapa 0 como o usuário entra —
 * escolhendo modalidade e estabelecimento — porque pular direto para a etapa 1
 * testaria um estado que a aplicação nunca produz sozinha.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import type { Court } from '../../types/api'
import CriarPelada from './index'

vi.mock('../../services/courts')
vi.mock('../../services/events')
vi.mock('../../services/auth')
vi.mock('../../services/sports')
vi.mock('../../services/notificationService')

import { searchCourts } from '../../services/courts'
import { createEvent } from '../../services/events'
import * as authService from '../../services/auth'
import { getSports } from '../../services/sports'
import { notificationService } from '../../services/notificationService'

const buscaQuadras = vi.mocked(searchCourts)
const criaEvento = vi.mocked(createEvent)

const QUADRA: Court = {
  id: 'quadra-1',
  name: 'Quadra Coberta',
  type: 'SOCIETY',
  status: 'OPEN',
  pricePerHour: '120',
  placeId: 'local-1',
  place: { id: 'local-1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG' },
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  vi.mocked(authService.getMe).mockResolvedValue(envelope(criaUsuario({ id: 'user-1' })))
  vi.mocked(getSports).mockRejectedValue(erroDaApi('sem sports', 503))
  vi.mocked(notificationService.list).mockResolvedValue([])
  buscaQuadras.mockResolvedValue(envelope([QUADRA]))
})

/**
 * Percorre a etapa 0 até o formulário: modalidade → estabelecimento.
 *
 * Com uma única quadra no estabelecimento, a página seleciona sozinha e pula
 * para a etapa 1 — é o atalho que o próprio componente implementa.
 */
async function vaiAteOFormulario() {
  const resultado = renderWithProviders(<CriarPelada />)
  const { user } = resultado

  await screen.findByRole('button', { name: /Society/ })
  await user.click(screen.getByRole('button', { name: /Society/ }))

  await user.click(await screen.findByText('Arena Sul'))
  await screen.findByText(/detalhes da partida em/i)

  return resultado
}

/** O input de data e hora não tem role nem label associado. */
function campoData(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="datetime-local"]')!
}

function preenche(container: HTMLElement) {
  return {
    data: campoData(container),
    vagas: screen.getByPlaceholderText('Ex: 10'),
    valor: screen.getByPlaceholderText('Ex: 100.00'),
    pix: screen.getByPlaceholderText(/CPF, e-mail, telefone/i),
    enviar: screen.getByRole('button', { name: /criar partida/i }),
  }
}

describe('CriarPelada — chegar ao formulário', () => {
  it('mostra as modalidades das quadras disponíveis', async () => {
    renderWithProviders(<CriarPelada />)

    expect(await screen.findByText(/qual modalidade você quer jogar/i)).toBeInTheDocument()
  })

  it('avisa quando não há quadra nenhuma cadastrada', async () => {
    buscaQuadras.mockResolvedValue(envelope([]))
    const { user } = renderWithProviders(<CriarPelada />)

    await user.click(await screen.findByRole('button', { name: /Society/ }))

    expect(
      await screen.findByText(/nenhum estabelecimento disponível para essa modalidade/i),
    ).toBeInTheDocument()
  })
})

describe('CriarPelada — validação do formulário', () => {
  it('não envia nada com o formulário vazio e cobra os quatro campos', async () => {
    const { user } = await vaiAteOFormulario()

    await user.click(screen.getByRole('button', { name: /criar partida/i }))

    expect(await screen.findByText('Informe a data e horário')).toBeInTheDocument()
    expect(screen.getByText('Informe a chave Pix para pagamento')).toBeInTheDocument()
    // As duas de baixo eram `Informe um número válido` e `Informe um valor
    // válido`: campo numérico vazio virava NaN e o typeError respondia antes do
    // `.required()`. O transform do schema devolve a vez para estas.
    expect(screen.getByText('Informe o número de vagas')).toBeInTheDocument()
    expect(screen.getByText('Informe o valor total da partida')).toBeInTheDocument()
    expect(criaEvento).not.toHaveBeenCalled()
  })

  /**
   * Os quatro casos abaixo eram barrados ANTES do yup, pela validação nativa do
   * HTML — o navegador recusava o envio pelos `min`/`max` e o `handleSubmit`
   * nunca rodava. Com `noValidate` no formulário, quem responde é o schema, e a
   * mensagem que aparece é a que o time escreveu.
   *
   * Os `min`/`max` seguem nos inputs de propósito: sem bloquear o envio, ainda
   * limitam as setas e o seletor de data.
   */
  it('barra data no passado com a mensagem do time', async () => {
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2020-01-01T10:00')
    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect(await screen.findByText('A data deve ser no futuro')).toBeInTheDocument()
    expect(criaEvento).not.toHaveBeenCalled()
    expect(screen.queryByText('Partida criada com sucesso!')).not.toBeInTheDocument()
  })

  it('barra menos de 2 vagas — pelada de um jogador só não existe', async () => {
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2027-06-10T19:00')
    await user.type(campos.vagas, '1')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect(await screen.findByText('Mínimo 2 jogadores')).toBeInTheDocument()
    expect(criaEvento).not.toHaveBeenCalled()
  })

  it('barra mais de 50 vagas', async () => {
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2027-06-10T19:00')
    await user.type(campos.vagas, '51')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect(await screen.findByText('Máximo 50 jogadores')).toBeInTheDocument()
    expect(criaEvento).not.toHaveBeenCalled()
  })

  it('barra valor negativo', async () => {
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2027-06-10T19:00')
    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '-50')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect(await screen.findByText('Valor não pode ser negativo')).toBeInTheDocument()
    expect(criaEvento).not.toHaveBeenCalled()
  })

  it('mostra o rateio por pessoa enquanto o usuário digita', async () => {
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '250')

    // É a conta que o jogador vai conferir antes de aceitar entrar.
    expect(await screen.findByText('≈ R$ 25.00 por pessoa')).toBeInTheDocument()
  })
})

describe('CriarPelada — envio', () => {
  it('envia os campos convertidos e confirma o sucesso na tela', async () => {
    criaEvento.mockResolvedValue(envelope({ id: 'pelada-nova' } as never))
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2027-06-10T19:00')
    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    await waitFor(() => expect(criaEvento).toHaveBeenCalledTimes(1))
    const [quadraId, payload] = criaEvento.mock.calls[0]
    expect(quadraId).toBe('quadra-1')
    // Os inputs devolvem string; a API espera número e data ISO.
    expect(payload).toMatchObject({
      maxPlayers: 10,
      totalValue: 200,
      pixKey: 'pix@exemplo.com',
    })
    expect(payload.date).toBe(new Date('2027-06-10T19:00').toISOString())

    expect(await screen.findByText('Partida criada com sucesso!')).toBeInTheDocument()
  })

  it('renderiza na tela a mensagem de erro que a API devolveu', async () => {
    criaEvento.mockRejectedValue(erroDaApi('Já existe uma pelada nesta quadra neste horário'))
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2027-06-10T19:00')
    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect(
      await screen.findByText(/já existe uma pelada nesta quadra neste horário/i),
    ).toBeInTheDocument()
    // Continua no formulário: o usuário precisa poder corrigir e reenviar.
    expect(screen.queryByText('Partida criada com sucesso!')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar partida/i })).toBeEnabled()
  })

  it('cai numa mensagem genérica quando o erro não tem corpo da API', async () => {
    criaEvento.mockRejectedValue(new Error(''))
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2027-06-10T19:00')
    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect(await screen.findByText(/erro ao criar partida/i)).toBeInTheDocument()
  })
})
