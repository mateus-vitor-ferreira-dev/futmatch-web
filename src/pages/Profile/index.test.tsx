/**
 * O que o formulário de perfil manda no PATCH.
 *
 * Antes ele mandava o formulário inteiro a cada salvamento, e um campo que ele
 * não conseguiu preencher viajava vazio — indistinguível de "quero apagar
 * isto". Bastava a chave PIX não ter chegado no objeto de usuário para trocar
 * o nome apagar o PIX de quem nunca encostou nele.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaUsuario, envelope } from '../../test/factories'
import { SESSION_HINT_KEY, marcarSessao } from '../../services/api'
import Profile from './index'

vi.mock('../../services/auth')
vi.mock('../../services/users')

import * as authService from '../../services/auth'
import * as usersService from '../../services/users'

const getMe = vi.mocked(authService.getMe)
const updateMe = vi.mocked(usersService.updateMe)
const deleteMe = vi.mocked(usersService.deleteMe)

const CAMPO_NOME = 'Seu nome'
const CAMPO_PIX  = 'CPF, e-mail, telefone ou chave aleatória'

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
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

describe('Perfil — exclusão de conta', () => {
  it('permite cancelar a confirmação sem chamar a API', async () => {
    const { user } = await abrePerfil()

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    expect(screen.getByRole('dialog', { name: 'Excluir sua conta?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog', { name: 'Excluir sua conta?' })).not.toBeInTheDocument()
    expect(deleteMe).not.toHaveBeenCalled()
  })

  it('exige a frase, exclui, encerra a sessão e redireciona', async () => {
    deleteMe.mockResolvedValue({ status: 204 } as Awaited<ReturnType<typeof usersService.deleteMe>>)
    const { user } = await abrePerfil()

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    const confirmar = screen.getByRole('button', { name: 'Confirmar exclusão' })
    expect(confirmar).toBeDisabled()

    await user.type(screen.getByLabelText('Digite EXCLUIR MINHA CONTA'), 'EXCLUIR MINHA CONTA')
    await user.type(screen.getByLabelText(/Senha atual/), 'senha123')
    await user.click(confirmar)

    await waitFor(() => expect(deleteMe).toHaveBeenCalledWith({
      confirmation: 'EXCLUIR MINHA CONTA',
      currentPassword: 'senha123',
    }))
    await waitFor(() => expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull())
  })
})


/**
 * As três causas da #242, cada uma com o seu teste.
 *
 * O relato de produção era "alterar um único campo não funciona", e a
 * investigação achou três defeitos distintos com o mesmo sintoma. Dois moravam
 * na API (o telefone que não existia — api#319 — e o `/auth/me` que não
 * devolvia o consentimento — api#320) e já foram publicados. O terceiro é este
 * arquivo: **o erro engolido**, que é o que fazia qualquer um dos outros dois
 * parecer "não está funcionando e não sei por quê".
 */
describe('Perfil — a #242', () => {
  it('mostra o erro na tela quando o PATCH falha', async () => {
    // AxiosError de verdade: o `mensagemDeErro` só lê o corpo da API quando o
    // erro é um, e um objeto com a mesma forma cairia no fallback genérico —
    // o teste passaria sem provar que a mensagem da API chega à tela.
    updateMe.mockRejectedValueOnce(
      new AxiosError('Request failed', '422', undefined, undefined, {
        status: 422,
        data: { success: false, message: 'Telefone deve ter DDD e entre 10 e 15 dígitos' },
      } as never),
    )

    const { user } = await abrePerfil()
    const nome = screen.getByPlaceholderText(CAMPO_NOME)
    await user.clear(nome)
    await user.type(nome, 'Outro Nome')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    // Antes disto a promise rejeitava e a tela não dizia nada — nem toast, nem
    // mensagem. Falhar calado é o defeito que dá nome à issue.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Telefone deve ter DDD e entre 10 e 15 dígitos',
    )
  })

  it('limpa o erro anterior quando a pessoa tenta de novo e dá certo', async () => {
    updateMe.mockRejectedValueOnce(new Error('rede caiu'))

    const { user } = await abrePerfil()
    const nome = screen.getByPlaceholderText(CAMPO_NOME)
    await user.clear(nome)
    await user.type(nome, 'Outro Nome')
    const salvar = screen.getByRole('button', { name: 'Salvar alterações' })
    await user.click(salvar)
    await screen.findByRole('alert')

    // Erro que sobra na tela depois de dar certo é pior que erro nenhum.
    await user.click(salvar)
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('o telefone vem do usuário e viaja no PATCH', async () => {
    // O valor guardado é a string COMBINADA que o PhoneInput monta, com o DDI
    // dentro. Foi montar o fixture assim que revelou a api#323: a validação da
    // API exigia 10 ou 11 dígitos e teria recusado os 13 que isto tem.
    getMe.mockResolvedValue(
      envelope(criaUsuario({ pixKey: 'mateus@pix.com', phone: '+55 (21) 2222-3333' })),
    )

    const { user } = await abrePerfil()
    // `find`, e não `get`: o PhoneInput sincroniza o número local a partir do
    // `value` num useEffect próprio, então ele se preenche um tick DEPOIS do
    // resto do formulário. Com `get` este teste falhava uma vez a cada três —
    // e a corrida é do componente, não do teste.
    const telefone = await screen.findByDisplayValue('(21) 2222-3333')

    await user.clear(telefone)
    await user.type(telefone, '21999998888')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(updateMe).toHaveBeenCalledTimes(1))
    // Com o DDI que o componente acrescenta, e sem nenhum outro campo junto.
    expect(updateMe).toHaveBeenCalledWith({ phone: '+55 (21) 99999-8888' })
  })

  it('o checkbox de marketing abre marcado para quem optou, e dá para desmarcar', async () => {
    getMe.mockResolvedValue(
      envelope(criaUsuario({ pixKey: 'mateus@pix.com', marketingOptIn: true })),
    )

    const { user } = await abrePerfil()
    const optIn = screen.getByRole('checkbox', { name: /quero receber novidades/i })

    // O `/auth/me` não devolvia o campo, o formulário lia `?? false` e o
    // checkbox abria desmarcado para quem tinha optado por receber. Quem queria
    // SAIR não conseguia: já estava desmarcado, o campo não ficava sujo, e o
    // formulário só manda campo sujo. Ver api#320.
    expect(optIn).toBeChecked()

    await user.click(optIn)
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(updateMe).toHaveBeenCalledWith({ marketingOptIn: false }))
  })
})
