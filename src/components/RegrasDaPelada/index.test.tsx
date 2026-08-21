/**
 * As regras de acesso de uma pelada que já existe (#228).
 *
 * O teste que carrega este componente é o do **diff**: salvar tem de mandar
 * para a API só o que mudou. Reenviar tudo funcionaria e escreveria uma vez por
 * regra a cada confirmação — inclusive quando o organizador abriu, olhou e
 * fechou no "Salvar".
 *
 * O segundo é o da **frase sobre quem já está dentro**. Mudar regra com gente
 * na pelada parece uma ação de risco indeterminado, e é a dúvida que faz o
 * organizador não mexer.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaPelada, criaResumoDeTime, envelope, erroDaApi } from '../../test/factories'
import type { PeladaRequirement } from '../../types/api'
import { playerService } from '../../services/playerService'
import { teamsService } from '../../services/teams'
import { RegrasDaPelada } from './index'

vi.mock('../../services/playerService')
vi.mock('../../services/teams')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const listar = vi.mocked(playerService.listRequirements)
const anexar = vi.mocked(playerService.upsertRequirement)
const remover = vi.mocked(playerService.deleteRequirement)
const trocarVisibilidade = vi.mocked(playerService.updateEventVisibility)

const partida = criaPelada({ visibility: 'PUBLIC' })

function monta(requisitos: PeladaRequirement[] = []) {
  listar.mockResolvedValue(envelope(requisitos))
  const onClose = vi.fn()
  const onSaved = vi.fn()
  const { user } = renderWithProviders(
    <RegrasDaPelada partida={partida} onClose={onClose} onSaved={onSaved} />,
  )
  return { user, onClose, onSaved }
}

const salvar = () => screen.getByRole('button', { name: 'Salvar regras' })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(teamsService.meusTimes).mockResolvedValue([criaResumoDeTime({ id: 'time-1', name: 'Quarta Sagrada' })])
  anexar.mockResolvedValue(envelope({ type: 'BADGE', params: null } as PeladaRequirement))
  remover.mockResolvedValue(undefined)
  trocarVisibilidade.mockResolvedValue(envelope(partida))
})

describe('RegrasDaPelada', () => {
  it('carrega as regras que a pelada já tem', async () => {
    monta([{ type: 'MIN_MATCHES_PLAYED', params: { min: 8 } }])

    expect(await screen.findByLabelText('Peladas já jogadas')).toHaveValue(8)
    expect(listar).toHaveBeenCalledWith('quadra-1', 'pelada-1')
  })

  it('diz o que acontece com quem já está dentro', async () => {
    monta()

    expect(await screen.findByText(/não expulsa ninguém/)).toBeInTheDocument()
  })

  it('não escreve nada quando o organizador não mudou nada', async () => {
    const { user } = monta([{ type: 'MIN_MATCHES_PLAYED', params: { min: 8 } }])

    await screen.findByLabelText('Peladas já jogadas')
    await user.click(salvar())

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(anexar).not.toHaveBeenCalled()
    expect(remover).not.toHaveBeenCalled()
    expect(trocarVisibilidade).not.toHaveBeenCalled()
  })

  it('remove o que saiu e anexa o que entrou, e só isso', async () => {
    const { user } = monta([
      { type: 'MIN_MATCHES_PLAYED', params: { min: 8 } },
      { type: 'MIN_AVERAGE_RATING', params: { min: 4 } },
    ])

    await user.click(await screen.findByRole('button', { name: 'Remover regra: Nota média' }))
    await user.selectOptions(screen.getByLabelText('Adicionar uma regra de entrada'), 'MIN_ATTENDANCE_RATE')
    await user.click(salvar())

    await waitFor(() => expect(remover).toHaveBeenCalledWith('quadra-1', 'pelada-1', 'MIN_AVERAGE_RATING'))
    expect(anexar).toHaveBeenCalledExactlyOnceWith('quadra-1', 'pelada-1', 'MIN_ATTENDANCE_RATE', { min: 0.7 })
    // A que não mudou fica fora das duas listas.
    expect(anexar).not.toHaveBeenCalledWith('quadra-1', 'pelada-1', 'MIN_MATCHES_PLAYED', expect.anything())
  })

  it('troca a visibilidade só quando ela mudou', async () => {
    const { user, onClose } = monta()

    await user.click(await screen.findByRole('radio', { name: /Privada/ }))
    await user.click(salvar())

    await waitFor(() => expect(trocarVisibilidade).toHaveBeenCalledWith('quadra-1', 'pelada-1', 'PRIVATE'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('recusa selo sem nenhum selo marcado, antes de chamar a API', async () => {
    const { user } = monta()

    await user.selectOptions(
      await screen.findByLabelText('Adicionar uma regra de entrada'),
      'BADGE',
    )
    await user.click(salvar())

    // A API responderia 422, e o erro chegaria depois de a visibilidade já ter
    // sido trocada. Barrar aqui deixa o organizador consertar sem efeito parcial.
    expect(toast.error).toHaveBeenCalledWith('Marque ao menos um selo, ou remova a regra de selo.')
    expect(anexar).not.toHaveBeenCalled()
  })

  it('mantém o modal aberto quando salvar falha', async () => {
    anexar.mockRejectedValue(erroDaApi('Requisito inválido', 422))
    const { user, onClose } = monta()

    await user.selectOptions(
      await screen.findByLabelText('Adicionar uma regra de entrada'),
      'MIN_MATCHES_PLAYED',
    )
    await user.click(salvar())

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Requisito inválido'))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Regras de acesso' })).toBeInTheDocument()
  })

  it('mostra a falha de carregamento sem fechar, e deixa tentar de novo', async () => {
    listar.mockRejectedValueOnce(erroDaApi('Regras indisponíveis', 503))
    listar.mockResolvedValue(envelope([{ type: 'MIN_MATCHES_PLAYED', params: { min: 3 } }]))
    const onClose = vi.fn()
    const { user } = renderWithProviders(<RegrasDaPelada partida={partida} onClose={onClose} />)

    expect(await screen.findByText('Não foi possível carregar as regras desta pelada.')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByLabelText('Peladas já jogadas')).toHaveValue(3)
  })
})
