/**
 * Fluxo crítico: criar uma partida.
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
import type { UserEvent } from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import type { Court } from '../../types/api'
import CriarPartida from './index'

vi.mock('../../services/courts')
vi.mock('../../services/events')
vi.mock('../../services/auth')
vi.mock('../../services/sports')
vi.mock('../../services/notificationService')
vi.mock('../../services/playerService')
vi.mock('../../services/teams')

import { searchCourts } from '../../services/courts'
import { createEvent } from '../../services/events'
import { playerService } from '../../services/playerService'
import { teamsService } from '../../services/teams'
import * as authService from '../../services/auth'
import { getSports } from '../../services/sports'
import { notificationService } from '../../services/notificationService'

const buscaQuadras = vi.mocked(searchCourts)
const criaEvento = vi.mocked(createEvent)
const anexaRequisito = vi.mocked(playerService.upsertRequirement)

const QUADRA: Court = {
  id: 'quadra-1',
  name: 'Quadra Coberta',
  type: 'SOCIETY',
  status: 'OPEN',
  pricePerHour: '120',
  placeId: 'local-1',
  place: { id: 'local-1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG', latitude: -21.24, longitude: -44.99 },
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
  vi.mocked(teamsService.meusTimes).mockResolvedValue([])
  anexaRequisito.mockResolvedValue(envelope({ type: 'MIN_MATCHES_PLAYED', params: { min: 5 } }))
})

/**
 * Percorre a etapa 0 até o formulário: modalidade → estabelecimento.
 *
 * Com uma única quadra no estabelecimento, a página seleciona sozinha e pula
 * para a etapa 1 — é o atalho que o próprio componente implementa.
 */
async function vaiAteOFormulario() {
  const resultado = renderWithProviders(<CriarPartida />)
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

describe('CriarPartida — chegar ao formulário', () => {
  it('mostra as modalidades das quadras disponíveis', async () => {
    renderWithProviders(<CriarPartida />)

    expect(await screen.findByText(/qual modalidade você quer jogar/i)).toBeInTheDocument()
  })

  it('avisa quando não há quadra nenhuma cadastrada', async () => {
    buscaQuadras.mockResolvedValue(envelope([]))
    const { user } = renderWithProviders(<CriarPartida />)

    await user.click(await screen.findByRole('button', { name: /Society/ }))

    expect(
      await screen.findByText(/nenhum estabelecimento disponível para essa modalidade/i),
    ).toBeInTheDocument()
  })
})

describe('CriarPartida — validação do formulário', () => {
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

  it('barra menos de 2 vagas — partida de um jogador só não existe', async () => {
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

describe('CriarPartida — envio', () => {
  it('envia os campos convertidos e confirma o sucesso na tela', async () => {
    criaEvento.mockResolvedValue(envelope({ id: 'partida-nova' } as never))
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
    criaEvento.mockRejectedValue(erroDaApi('Já existe uma partida agendada para esta quadra neste horário'))
    const { container, user } = await vaiAteOFormulario()
    const campos = preenche(container)

    await user.type(campos.data, '2027-06-10T19:00')
    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '200')
    await user.type(campos.pix, 'pix@exemplo.com')
    await user.click(campos.enviar)

    expect(
      await screen.findByText(/já existe uma partida agendada para esta quadra neste horário/i),
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

/**
 * Visibilidade e requisitos, na criação (#228).
 *
 * O que carrega este bloco é a **ordem**: o requisito é pendurado na partida, e
 * a partida precisa existir para ter id. A consequência é que a criação pode dar
 * certo e a regra não — e o teste que importa é o de que, nesse caso, a partida
 * criada **continua criada**. Apagá-la para "limpar" destruiria o que deu certo
 * por causa do que não deu.
 */
describe('CriarPartida — quem vê e quem entra', () => {
  async function preencheEEnvia(container: HTMLElement, user: UserEvent) {
    const campos = preenche(container)
    await user.type(campos.data, '2027-03-11T19:00')
    await user.type(campos.vagas, '10')
    await user.type(campos.valor, '100')
    await user.type(campos.pix, 'pix@arena.com')
    await user.click(campos.enviar)
  }

  it('cria pública por padrão, sem regra nenhuma', async () => {
    const { user, container } = await vaiAteOFormulario()

    await preencheEEnvia(container, user)

    await waitFor(() => expect(criaEvento).toHaveBeenCalled())
    expect(criaEvento.mock.calls[0][1]).toMatchObject({ visibility: 'PUBLIC' })
    // Partida sem regra é a esmagadora maioria, e ela não pode pagar nenhuma
    // requisição a mais por causa do caso raro.
    expect(anexaRequisito).not.toHaveBeenCalled()
  })

  it('manda a visibilidade escolhida junto da criação', async () => {
    const { user, container } = await vaiAteOFormulario()

    await user.click(screen.getByRole('radio', { name: /Privada/ }))
    await preencheEEnvia(container, user)

    await waitFor(() => expect(criaEvento).toHaveBeenCalled())
    expect(criaEvento.mock.calls[0][1]).toMatchObject({ visibility: 'PRIVATE' })
  })

  it('anexa os requisitos depois de a partida existir', async () => {
    criaEvento.mockResolvedValue(envelope({ id: 'partida-nova' } as never))
    const { user, container } = await vaiAteOFormulario()

    await user.selectOptions(
      screen.getByLabelText('Adicionar uma regra de entrada'),
      'MIN_MATCHES_PLAYED',
    )
    await preencheEEnvia(container, user)

    await waitFor(() =>
      expect(anexaRequisito).toHaveBeenCalledWith('quadra-1', 'partida-nova', 'MIN_MATCHES_PLAYED', {
        min: 5,
      }),
    )
    expect(await screen.findByText(/partida criada/i)).toBeInTheDocument()
  })

  it('a partida continua criada quando a regra falha, e o aviso diz onde consertar', async () => {
    criaEvento.mockResolvedValue(envelope({ id: 'partida-nova' } as never))
    anexaRequisito.mockRejectedValue(erroDaApi('Requisito inválido', 422))
    const { user, container } = await vaiAteOFormulario()

    await user.selectOptions(
      screen.getByLabelText('Adicionar uma regra de entrada'),
      'MIN_MATCHES_PLAYED',
    )
    await preencheEEnvia(container, user)

    // Chega ao passo de confirmação: a partida existe.
    expect(await screen.findByText(/partida criada/i)).toBeInTheDocument()
    expect(screen.getByText(/nem todas as regras foram salvas/i)).toBeInTheDocument()
  })

  it('não deixa criar com a regra de selo vazia', async () => {
    const { user, container } = await vaiAteOFormulario()

    await user.selectOptions(screen.getByLabelText('Adicionar uma regra de entrada'), 'BADGE')
    await preencheEEnvia(container, user)

    // A API responderia 422 — depois de a partida existir. Barrar aqui é o que
    // evita a partida criada com metade das regras.
    expect(await screen.findByText(/Marque ao menos um selo/)).toBeInTheDocument()
    expect(criaEvento).not.toHaveBeenCalled()
  })
})
