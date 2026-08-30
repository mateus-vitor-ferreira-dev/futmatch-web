/**
 * O convite de professor (web#377, api#451).
 *
 * O teste que carrega o arquivo é o da **conta errada**. O convite é endereçado
 * a um e-mail, e a api confere isso contra o banco — quem clica no link estando
 * logado em outra conta leva `403 PLACE_INVITE_OTHER_EMAIL`. Tratado como erro
 * genérico ("não foi possível aceitar"), manda a pessoa tentar de novo no lugar
 * de trocar de conta, e ela nunca aceita. É a mesma classe de defeito da
 * web#250: não deixar quem foi recusado saber o que fazer.
 *
 * O segundo é o de **funcionar deslogada**. O `verify` é público justamente
 * porque quem ainda não tem conta precisa ver de quem é o convite antes de
 * decidir se vale se cadastrar — foi o que separou este modelo do `TeamInvite`.
 * Uma tela que exigisse sessão fecharia o caminho que a api abriu.
 *
 * O terceiro é o de **não inventar a diferença entre vencido e inexistente**. A
 * api responde o mesmo 404 para os dois de propósito, e distinguir aqui
 * devolveria pela interface o que ela tinha acabado de esconder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { professoresService } from '../../services/professores'
import ConviteDeProfessor from './index'

vi.mock('../../services/professores')

const auth = vi.hoisted(() => ({
  estado: {
    user: { id: 'eu', email: 'ana@player.com' },
    isAuthenticated: true,
    loading: false,
    refreshUser: vi.fn(),
  },
}))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const servico = vi.mocked(professoresService)

function erro(status: number, code: string, message = 'erro'): AxiosError {
  const e = new AxiosError(message)
  e.response = {
    status, data: { success: false, message, code },
    statusText: '', headers: new AxiosHeaders(), config: { headers: new AxiosHeaders() },
  }
  return e
}

const CONVITE = {
  place: { id: 'ltc', name: 'Lavras Tênis Clube' },
  papel: 'PROFESSOR' as const,
  expiresAt: '2026-09-05T00:00:00.000Z',
}

const monta = (token = 'seed-prof-pendente') =>
  renderWithProviders(<ConviteDeProfessor />, {
    route: `/convite-professor?convite=${token}`,
    path: '/convite-professor',
  })

beforeEach(() => {
  vi.clearAllMocks()
  auth.estado = {
    user: { id: 'eu', email: 'ana@player.com' },
    isAuthenticated: true,
    loading: false,
    refreshUser: vi.fn(),
  }
  servico.verificar.mockResolvedValue(CONVITE)
  servico.aceitar.mockResolvedValue({ id: 'v1', papel: 'PROFESSOR', place: CONVITE.place })
  servico.recusar.mockResolvedValue({ status: 'DECLINED', place: CONVITE.place })
})

describe('ConviteDeProfessor', () => {
  it('funciona deslogada e oferece entrar ou criar conta, voltando para cá', async () => {
    auth.estado = { ...auth.estado, user: null, isAuthenticated: false } as never

    monta()

    expect(await screen.findByRole('heading', { name: 'Lavras Tênis Clube' })).toBeInTheDocument()

    const volta = encodeURIComponent('/convite-professor?convite=seed-prof-pendente')
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', `/login?next=${volta}`)
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', `/register?next=${volta}`)

    // E nada de aceitar sem sessão: a api recusaria, e o botão só ensinaria isso tarde.
    expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument()
  })

  it('logada com o e-mail certo, aceita e recarrega o /auth/me', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /aceitar convite/i }))

    await waitFor(() => expect(servico.aceitar).toHaveBeenCalledWith('seed-prof-pendente'))
    expect(await screen.findByText(/Você agora é professor em Lavras Tênis Clube/)).toBeInTheDocument()
    // Sem isto, a pessoa aceita e o app continua dizendo que ela não é
    // professora de lugar nenhum — o vínculo vive no /auth/me.
    expect(auth.estado.refreshUser).toHaveBeenCalled()
  })

  it('recusar não cria nada, e a tela diz isso', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /recusar/i }))

    await waitFor(() => expect(servico.recusar).toHaveBeenCalledWith('seed-prof-pendente'))
    expect(await screen.findByText(/Nada foi criado/)).toBeInTheDocument()
  })

  it('na conta errada, nomeia a conta atual e oferece trocar — em vez de "tente de novo"', async () => {
    servico.aceitar.mockRejectedValue(erro(403, 'PLACE_INVITE_OTHER_EMAIL'))

    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /aceitar convite/i }))

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('ana@player.com')
    expect(aviso).toHaveTextContent(/outro e-mail/i)

    // A saída é trocar de conta, e ela está na tela.
    expect(screen.getByRole('button', { name: /entrar com outra conta/i })).toBeInTheDocument()
    // E o botão de aceitar sai: insistir nele repetiria o mesmo 403.
    expect(screen.queryByRole('button', { name: /aceitar convite/i })).not.toBeInTheDocument()
  })

  it('vencido e inexistente dizem a mesma coisa — a tela não inventa a diferença', async () => {
    servico.verificar.mockRejectedValue(erro(404, 'PLACE_INVITE_EXPIRED'))
    const { unmount } = monta()
    expect(await screen.findByText(/Este link não vale mais/)).toBeInTheDocument()
    unmount()

    servico.verificar.mockRejectedValue(erro(404, 'PLACE_INVITE_NOT_FOUND'))
    monta('token-que-nunca-existiu')
    expect(await screen.findByText(/Este link não vale mais/)).toBeInTheDocument()
  })

  it('convite já respondido tem texto próprio — ali a pessoa não fez nada errado', async () => {
    servico.verificar.mockRejectedValue(erro(409, 'PLACE_INVITE_ALREADY_ANSWERED'))

    monta()

    expect(await screen.findByRole('heading', { name: /já foi respondido/i })).toBeInTheDocument()
  })

  it('link sem o código não chega a consultar a api', async () => {
    renderWithProviders(<ConviteDeProfessor />, {
      route: '/convite-professor',
      path: '/convite-professor',
    })

    expect(await screen.findByRole('heading', { name: /link incompleto/i })).toBeInTheDocument()
    expect(servico.verificar).not.toHaveBeenCalled()
  })
})
