/**
 * O endereço do jogador no perfil (#221).
 *
 * Dois testes carregam esta issue.
 *
 * O primeiro é o do **CEP que preenche sozinho**: é o que tira do jogador a
 * digitação de uma informação que o sistema já sabe, e a api#372 existe para
 * isso. Um componente que consultasse e não usasse a resposta passaria em todos
 * os outros testes.
 *
 * O segundo é o dos **campos bloqueados com CEP**. A API ignora cidade e UF
 * quando consegue derivá-las; deixá-las editáveis mostraria à pessoa um valor
 * que não seria salvo — que é pior que não deixar editar.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import * as usersService from '../../services/users'
import * as authService from '../../services/auth'
import { notificationService } from '../../services/notificationService'
import { EnderecoDoJogador } from './index'

vi.mock('../../services/users')
vi.mock('../../services/auth')
vi.mock('../../services/notificationService')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }))

const consultarCep = vi.mocked(usersService.consultarCep)
const salvarEndereco = vi.mocked(usersService.salvarEndereco)
const apagarEndereco = vi.mocked(usersService.apagarEndereco)

const LAVRAS = {
  zipCode: '37200100',
  street: 'Rua São João',
  neighborhood: 'Centro',
  city: 'Lavras',
  state: 'MG',
  fonte: 'viacep' as const,
}

function comUsuario(address: Record<string, unknown> | undefined = undefined) {
  vi.mocked(authService.getMe).mockResolvedValue(
    envelope(criaUsuario({ id: 'user-1', ...(address ? { address } : {}) }) as never),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  vi.mocked(notificationService.list).mockResolvedValue([])
  comUsuario()
  consultarCep.mockResolvedValue({ data: envelope(LAVRAS) } as never)
  salvarEndereco.mockResolvedValue({ data: envelope(criaUsuario()) } as never)
  apagarEndereco.mockResolvedValue({} as never)
})

const campoCep = () => screen.getByLabelText('CEP')
const campoCidade = () => screen.getByLabelText('Cidade')

describe('EnderecoDoJogador', () => {
  it('diz para que serve e que é opcional, antes dos campos', () => {
    renderWithProviders(<EnderecoDoJogador />)

    // Pedir endereço sem dizer para quê é o tipo de campo que a pessoa pula —
    // e endereço que ninguém preenche deixa a recomendação devolvendo vazio.
    expect(screen.getByText(/achar peladas perto de você/i)).toBeInTheDocument()
    expect(screen.getByText(/É opcional/)).toBeInTheDocument()
  })

  it('não pede rua nem número', () => {
    renderWithProviders(<EnderecoDoJogador />)

    // É a decisão de LGPD da api#215, e ela vale pouco se a tela pedir o resto.
    expect(screen.queryByLabelText(/rua/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/número/i)).not.toBeInTheDocument()
  })

  it('o CEP completo preenche cidade e estado sozinho', async () => {
    const { user } = renderWithProviders(<EnderecoDoJogador />)

    await user.type(campoCep(), '37200100')

    await waitFor(() => expect(consultarCep).toHaveBeenCalledWith('37200100'))
    expect(await screen.findByDisplayValue('Lavras')).toBeInTheDocument()
    expect(screen.getByDisplayValue('MG')).toBeInTheDocument()
  })

  it('com CEP, cidade e estado ficam bloqueados', async () => {
    const { user } = renderWithProviders(<EnderecoDoJogador />)

    await user.type(campoCep(), '37200100')

    // A API ignora os dois quando deriva do CEP. Editáveis, eles mostrariam um
    // valor que não seria salvo.
    await waitFor(() => expect(campoCidade()).toBeDisabled())
    expect(screen.getByLabelText('UF')).toBeDisabled()
  })

  it('só consulta quando o CEP está completo', async () => {
    const { user } = renderWithProviders(<EnderecoDoJogador />)

    await user.type(campoCep(), '3720')

    await new Promise((r) => setTimeout(r, 600))
    expect(consultarCep).not.toHaveBeenCalled()
  })

  it('CEP recusado mostra o motivo e não apaga o que foi digitado', async () => {
    consultarCep.mockRejectedValue(erroDaApi('CEP não encontrado', 422))
    const { user } = renderWithProviders(<EnderecoDoJogador />)

    await user.type(campoCep(), '99999999')

    expect(await screen.findByText('CEP não encontrado')).toBeInTheDocument()
    // Quem errou um dígito corrige um caractere; limpar o campo o obrigaria a
    // redigitar tudo.
    expect(campoCep()).toHaveValue('99999-999')
  })

  it('sem CEP, salva com cidade e estado digitados à mão', async () => {
    const { user } = renderWithProviders(<EnderecoDoJogador />)

    await user.type(campoCidade(), 'Lavras')
    await user.type(screen.getByLabelText('UF'), 'MG')
    await user.click(screen.getByRole('button', { name: /Salvar endereço/ }))

    await waitFor(() =>
      expect(salvarEndereco).toHaveBeenCalledWith({ zipCode: null, city: 'Lavras', state: 'MG' }),
    )
  })

  it('não deixa salvar com o formulário vazio', () => {
    renderWithProviders(<EnderecoDoJogador />)

    expect(screen.getByRole('button', { name: /Salvar endereço/ })).toBeDisabled()
  })

  it('quem não tem endereço não vê o botão de remover', () => {
    renderWithProviders(<EnderecoDoJogador />)

    expect(screen.queryByRole('button', { name: /Remover endereço/ })).not.toBeInTheDocument()
  })

  it('mostra o erro da API sem perder o que foi preenchido', async () => {
    salvarEndereco.mockRejectedValue(erroDaApi('Não encontramos este CEP.', 422))
    const { user } = renderWithProviders(<EnderecoDoJogador />)

    await user.type(campoCidade(), 'Lavras')
    await user.type(screen.getByLabelText('UF'), 'MG')
    await user.click(screen.getByRole('button', { name: /Salvar endereço/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não encontramos este CEP.')
    expect(campoCidade()).toHaveValue('Lavras')
  })
})
