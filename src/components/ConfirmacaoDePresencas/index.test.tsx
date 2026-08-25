import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaPartida, criaUsuario, envelope, erroDaApi } from '../../test/factories'
import type { Participation } from '../../types/api'
import { playerService } from '../../services/playerService'
import { ConfirmacaoDePresencas } from './index'

vi.mock('../../services/playerService')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const buscaParticipantes = vi.mocked(playerService.getEventParticipants)
const confirmaPresenca = vi.mocked(playerService.confirmAttendance)
const partida = criaPartida({ status: 'FINISHED' })

function participacao(userId: string, name: string, attended: boolean | null): Participation {
  return {
    matchId: partida.id,
    userId,
    attended,
    joinedAt: '2026-08-20T12:00:00.000Z',
    user: criaUsuario({ id: userId, name }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  buscaParticipantes.mockResolvedValue(envelope([
    participacao('ana', 'Ana', true),
    participacao('bruno', 'Bruno', null),
  ]))
  confirmaPresenca.mockResolvedValue(envelope({} as Participation))
})

describe('ConfirmacaoDePresencas', () => {
  it('carrega, permite marcar ausência e salva a lista inteira', async () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const { user } = renderWithProviders(
      <ConfirmacaoDePresencas partida={partida} onClose={onClose} onSaved={onSaved} />,
    )

    const ana = await screen.findByRole('button', { name: 'Ana: Presente' })
    await user.click(ana)
    expect(screen.getByRole('button', { name: 'Ana: Ausente' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Salvar Presenças' }))

    await waitFor(() => {
      expect(confirmaPresenca).toHaveBeenCalledWith('quadra-1', 'partida-1', 'ana', false)
      expect(confirmaPresenca).toHaveBeenCalledWith('quadra-1', 'partida-1', 'bruno', true)
    })
    expect(onSaved).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('mantém o modal aberto quando salvar falha', async () => {
    confirmaPresenca.mockRejectedValue(erroDaApi('Não foi possível confirmar', 500))
    const onClose = vi.fn()
    const { user } = renderWithProviders(
      <ConfirmacaoDePresencas partida={partida} onClose={onClose} />,
    )

    await user.click(await screen.findByRole('button', { name: 'Salvar Presenças' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível confirmar'))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Confirmar Presenças' })).toBeInTheDocument()
  })

  it('mostra a falha de carregamento sem fechar e permite tentar novamente', async () => {
    buscaParticipantes.mockRejectedValueOnce(erroDaApi('Participantes indisponíveis', 503))
    const onClose = vi.fn()
    const { user } = renderWithProviders(
      <ConfirmacaoDePresencas partida={partida} onClose={onClose} />,
    )

    expect(await screen.findByText('Não foi possível carregar os participantes.')).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith('Participantes indisponíveis')
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('button', { name: 'Ana: Presente' })).toBeInTheDocument()
  })
})
