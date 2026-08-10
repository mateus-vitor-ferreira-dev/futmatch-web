/**
 * O que o formulário de perfil manda no PATCH.
 *
 * Antes ele mandava o formulário inteiro a cada salvamento, e um campo que ele
 * não conseguiu preencher viajava vazio — indistinguível de "quero apagar
 * isto". Bastava a chave PIX não ter chegado no objeto de usuário para trocar
 * o nome apagar o PIX de quem nunca encostou nele.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaUsuario, envelope } from '../../test/factories'
import { TOKEN_KEY } from '../../services/api'
import Profile from './index'

vi.mock('../../services/auth')
vi.mock('../../services/users')

import * as authService from '../../services/auth'
import * as usersService from '../../services/users'

const getMe = vi.mocked(authService.getMe)
const updateMe = vi.mocked(usersService.updateMe)

const CAMPO_NOME = 'Seu nome'
const CAMPO_PIX  = 'CPF, e-mail, telefone ou chave aleatória'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem(TOKEN_KEY, 'token-valido')
  getMe.mockResolvedValue(
    envelope(criaUsuario({ name: 'Mateus Ferreira', pixKey: 'mateus@pix.com' })),
  )
  updateMe.mockResolvedValue({ data: envelope(criaUsuario()) } as Awaited<
    ReturnType<typeof usersService.updateMe>
  >)
})

/** Renderiza e espera a sessão carregar — o formulário só se preenche depois. */
async function abrePerfil() {
  const resultado = renderWithProviders(<Profile />, { route: '/perfil' })
  await screen.findByDisplayValue('mateus@pix.com')
  return resultado
}

describe('Perfil — o que vai no PATCH', () => {
  it('manda só o campo mexido, e deixa o pixKey de fora', async () => {
    const { user } = await abrePerfil()

    const nome = screen.getByPlaceholderText(CAMPO_NOME)
    await user.clear(nome)
    await user.type(nome, 'Mateus V. Ferreira')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(updateMe).toHaveBeenCalledTimes(1))
    // Nem uma chave a mais: `pixKey: ''` aqui apagaria a chave no banco.
    expect(updateMe).toHaveBeenCalledWith({ name: 'Mateus V. Ferreira' })
  })

  it('manda pixKey null quando a pessoa apaga a chave de propósito', async () => {
    const { user } = await abrePerfil()

    await user.clear(screen.getByPlaceholderText(CAMPO_PIX))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    // Apagar continua funcionando — só que agora se escreve com null, que é
    // como a API distingue "remova isto" de "não sei o valor deste campo".
    await waitFor(() => expect(updateMe).toHaveBeenCalledWith({ pixKey: null }))
  })

  it('não chama a API quando nada mudou', async () => {
    const { user } = await abrePerfil()

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    // Salvar sem ter mexido em nada não tem por que virar escrita no banco.
    await waitFor(() => expect(getMe).toHaveBeenCalled())
    expect(updateMe).not.toHaveBeenCalled()
  })

  it('permite ligar e desligar o consentimento de marketing', async () => {
    const { user } = await abrePerfil()
    const optIn = screen.getByRole('checkbox', { name: /quero receber novidades/i })

    expect(optIn).not.toBeChecked()
    await user.click(optIn)
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(updateMe).toHaveBeenCalledWith({ marketingOptIn: true }))
  })
})
