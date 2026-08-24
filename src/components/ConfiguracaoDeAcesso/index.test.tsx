/**
 * Visibilidade e requisitos de entrada, na tela que os configura (#228).
 *
 * O teste que carrega esta issue é o da **conversão de porcentagem**: a API
 * guarda a presença como fração de 0 a 1 e recusa porcentagem, porque `1` seria
 * ambíguo. Quem digita pensa em `90`. Um componente que mandasse `90` para a
 * API criaria uma pelada que ninguém consegue entrar, e o erro só apareceria
 * quando a pelada não enchesse.
 */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, renderWithProviders, screen } from '../../test/render'
import { criaResumoDeTime } from '../../test/factories'
import type { PartidaRequirement } from '../../types/api'
import { ConfiguracaoDeAcesso } from './index'

function monta(over: Partial<Parameters<typeof ConfiguracaoDeAcesso>[0]> = {}) {
  const aoMudarVisibilidade = vi.fn()
  const aoMudarRequisitos = vi.fn()
  const { user } = renderWithProviders(
    <ConfiguracaoDeAcesso
      visibilidade="PUBLIC"
      aoMudarVisibilidade={aoMudarVisibilidade}
      requisitos={[]}
      aoMudarRequisitos={aoMudarRequisitos}
      {...over}
    />,
  )
  return { user, aoMudarVisibilidade, aoMudarRequisitos }
}

describe('ConfiguracaoDeAcesso — quem vê', () => {
  it('oferece as três visibilidades, cada uma explicada sem jargão', () => {
    monta()

    expect(screen.getByRole('radio', { name: /Pública/ })).toBeChecked()
    expect(screen.getByText(/Aparece na busca/)).toBeInTheDocument()
    // "Por link" e "privada" soam iguais para quem nunca leu a documentação, e
    // é a explicação que separa as duas.
    expect(screen.getByText(/pode repassá-lo/)).toBeInTheDocument()
    expect(screen.getByText(/o endereço sozinho não abre/)).toBeInTheDocument()
  })

  it('avisa a mudança de visibilidade', async () => {
    const { user, aoMudarVisibilidade } = monta()

    await user.click(screen.getByRole('radio', { name: /Privada/ }))

    expect(aoMudarVisibilidade).toHaveBeenCalledWith('PRIVATE')
  })
})

describe('ConfiguracaoDeAcesso — quem entra', () => {
  it('sem regra nenhuma, diz que qualquer pessoa entra', () => {
    monta()

    expect(screen.getByText('Nenhuma regra por enquanto.')).toBeInTheDocument()
  })

  it('adiciona uma regra já com valor inicial utilizável', async () => {
    const { user, aoMudarRequisitos } = monta()

    await user.selectOptions(screen.getByLabelText('Adicionar uma regra de entrada'), 'MIN_MATCHES_PLAYED')

    // Nasce com número, e não vazio: regra sem valor é regra que a API recusa.
    expect(aoMudarRequisitos).toHaveBeenCalledWith([{ type: 'MIN_MATCHES_PLAYED', params: { min: 5 } }])
  })

  it('não oferece de novo um tipo que já está na lista', async () => {
    monta({ requisitos: [{ type: 'MIN_MATCHES_PLAYED', params: { min: 5 } }] })

    // A API aceita um requisito por tipo, e reenviar substitui. Oferecer o tipo
    // como "adicionar" faria o organizador achar que está somando.
    const select = screen.getByLabelText('Adicionar uma regra de entrada')
    expect(select).not.toHaveTextContent('Partidas já jogadas')
  })

  it('remove a regra pelo botão', async () => {
    const requisitos: PartidaRequirement[] = [{ type: 'MIN_AVERAGE_RATING', params: { min: 4 } }]
    const { user, aoMudarRequisitos } = monta({ requisitos })

    await user.click(screen.getByRole('button', { name: 'Remover regra: Nota média' }))

    expect(aoMudarRequisitos).toHaveBeenCalledWith([])
  })

  it('converte a presença de porcentagem para a fração que a API espera', () => {
    const requisitos: PartidaRequirement[] = [{ type: 'MIN_ATTENDANCE_RATE', params: { min: 0.7 } }]
    const { aoMudarRequisitos } = monta({ requisitos })

    const campo = screen.getByLabelText('Presença mínima (%)')
    // O campo mostra 70, e não 0.7 — é o número que a pessoa pensa.
    expect(campo).toHaveValue(70)

    // `fireEvent`, e não `user.type`: o componente é controlado por quem o usa,
    // e neste teste quem o usa é um mock que não devolve o valor novo. Digitar
    // caractere a caractere acumularia em cima do 70 que continua na tela.
    fireEvent.change(campo, { target: { value: '90' } })

    // 0.9, e não 90: a API guarda fração porque `1` como porcentagem seria
    // ambíguo, e mandar 90 criaria uma pelada em que ninguém entra.
    expect(aoMudarRequisitos).toHaveBeenLastCalledWith([
      { type: 'MIN_ATTENDANCE_RATE', params: { min: 0.9 } },
    ])
  })

  it('marca e desmarca selos', async () => {
    const requisitos: PartidaRequirement[] = [{ type: 'BADGE', params: { badges: ['CRAQUE'] } }]
    const { user, aoMudarRequisitos } = monta({ requisitos })

    expect(screen.getByRole('checkbox', { name: 'Craque' })).toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Confiável' }))

    expect(aoMudarRequisitos).toHaveBeenCalledWith([
      { type: 'BADGE', params: { badges: ['CRAQUE', 'CONFIAVEL'] } },
    ])
  })

  it('só oferece o requisito de time para quem tem time', () => {
    monta()

    // Sem time, a opção não existe: oferecê-la levaria a um seletor vazio, e a
    // um requisito com `teamId` em branco que a API recusa.
    expect(screen.getByLabelText('Adicionar uma regra de entrada')).not.toHaveTextContent('Ser do meu time')
  })

  it('com time, a regra nasce apontando para o primeiro', async () => {
    const time = criaResumoDeTime({ id: 'time-1', name: 'Quarta Sagrada' })
    const { user, aoMudarRequisitos } = monta({ times: [time] })

    await user.selectOptions(screen.getByLabelText('Adicionar uma regra de entrada'), 'TEAM_MEMBER')

    expect(aoMudarRequisitos).toHaveBeenCalledWith([{ type: 'TEAM_MEMBER', params: { teamId: 'time-1' } }])
  })
})

describe('ConfiguracaoDeAcesso — o aviso de restrição', () => {
  it('cala quando a combinação é razoável', () => {
    monta({ requisitos: [{ type: 'MIN_MATCHES_PLAYED', params: { min: 3 } }] })

    // Avisar demais ensina a ignorar o aviso.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('avisa quando a presença exigida deixa de fora quase todo mundo', () => {
    monta({ requisitos: [{ type: 'MIN_ATTENDANCE_RATE', params: { min: 0.95 } }] })

    expect(screen.getByRole('status')).toHaveTextContent(/faltou uma vez em dez/)
  })

  it('avisa que o time fecha a pelada por completo', () => {
    monta({
      times: [criaResumoDeTime({ id: 'time-1' })],
      requisitos: [{ type: 'TEAM_MEMBER', params: { teamId: 'time-1' } }],
    })

    expect(screen.getByRole('status')).toHaveTextContent(/Só quem é do time entra/)
  })

  it('avisa quando três regras se somam', () => {
    monta({
      requisitos: [
        { type: 'MIN_MATCHES_PLAYED', params: { min: 3 } },
        { type: 'MIN_ATTENDANCE_RATE', params: { min: 0.6 } },
        { type: 'MIN_AVERAGE_RATING', params: { min: 3 } },
      ],
    })

    expect(screen.getByRole('status')).toHaveTextContent(/cada uma corta um pedaço/)
  })
})
