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
import { TOKEN_KEY } from '../../services/api'
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
  localStorage.setItem(TOKEN_KEY, 'token-valido')
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
  await screen.findByText(/detalhes da pelada em/i)

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
    enviar: screen.getByRole('button', { name: /criar pelada/i }),
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

    await user.click(screen.getByRole('button', { name: /criar pelada/i }))

    expect(await screen.findByText('Informe a data e horário')).toBeInTheDocument()
    expect(screen.getByText('Informe a chave Pix para pagamento')).toBeInTheDocument()
    // Campo numérico vazio vira NaN na conversão do yup, então quem responde é
    // o typeError — não o `.required()`. Ver a nota no fim deste arquivo.
    expect(screen.getByText('Informe um número válido')).toBeInTheDocument()
    expect(screen.getByText('Informe um valor válido')).toBeInTheDocument()
    expect(criaEvento).not.toHaveBeenCalled()
  })

  /**
   * Os três casos abaixo são barrados ANTES do yup, pela validação nativa do
   * HTML: os inputs carregam `min`/`max`, o navegador recusa o envio e o
   * `handleSubmit` nunca roda. O que o teste garante é o que de fato protege o
   * usuário — nada sai para a API. Ver a nota no fim deste arquivo.
   */
  it('barra data no passado — nada é enviado', async () => {
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2020-01-01T10:00')
    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect(campos.data.validity.rangeUnderflow).toBe(true)
    expect(criaEvento).not.toHaveBeenCalled()
    expect(screen.queryByText('Pelada criada com sucesso!')).not.toBeInTheDocument()
  })

  it('barra menos de 2 vagas — pelada de um jogador só não existe', async () => {
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2027-06-10T19:00')
    await user.type(campos.vagas, '1')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect((campos.vagas as HTMLInputElement).validity.rangeUnderflow).toBe(true)
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

    expect((campos.vagas as HTMLInputElement).validity.rangeOverflow).toBe(true)
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

    expect((campos.valor as HTMLInputElement).validity.rangeUnderflow).toBe(true)
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

    expect(await screen.findByText('Pelada criada com sucesso!')).toBeInTheDocument()
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
    expect(screen.queryByText('Pelada criada com sucesso!')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar pelada/i })).toBeEnabled()
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

    expect(await screen.findByText(/erro ao criar pelada/i)).toBeInTheDocument()
  })
})

/**
 * ── Duas descobertas que estes testes documentam ──────────────────────────
 *
 * 1. Quatro mensagens do schema yup são inalcançáveis pela interface, porque a
 *    validação nativa do HTML barra o envio antes:
 *
 *      'A data deve ser no futuro'   — o input tem `min={MIN_DATE}`
 *      'Mínimo 2 jogadores'          — o input tem `min={2}`
 *      'Máximo 50 jogadores'         — o input tem `max={50}`
 *      'Valor não pode ser negativo' — o input tem `min={0}`
 *
 *    Quem digita fora da faixa vê o balão do navegador, no idioma do
 *    navegador e fora do estilo do app — nunca a mensagem que o time escreveu.
 *    O yup segue valendo como rede de segurança contra envio programático,
 *    então nada aqui está errado; só não é o que se pensava estar entregando.
 *
 * 2. `.required('Informe o número de vagas')` e
 *    `.required('Informe o valor total da pelada')` também nunca aparecem:
 *    campo numérico vazio vira NaN na conversão, e NaN não é nulo — quem
 *    responde é o `typeError`.
 *
 * Os dois casos estão registrados como issue. Os testes acima afirmam o
 * comportamento REAL, não o pretendido: teste que afirma a intenção passa a
 * mentir no dia em que alguém "consertar" o formulário.
 */
