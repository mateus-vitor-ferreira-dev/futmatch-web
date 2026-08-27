/**
 * O convite que pede a origem — e as três formas de ele dar errado.
 *
 * Ele existe porque **nenhum cadastro pede endereço**: nem o de e-mail, nem o
 * do Google. Todo jogador novo cai no app sem de onde medir distância, e a
 * recomendação por proximidade fica sem chão (#328).
 *
 * As três formas de errar, e o teste de cada uma:
 *
 * 1. **Aparecer para quem não precisa.** Quem já tem origem não pode ver
 *    convite nenhum — é ruído sobre uma decisão já tomada.
 * 2. **Não sair depois de dispensado.** Convite que volta a cada visita é o que
 *    ensina a pessoa a não ler o que o app mostra.
 * 3. **Sumir sem ter sido resolvido.** Some sozinho no instante em que passa a
 *    existir origem, por qualquer das duas vias.
 *
 * A origem chega por prop, e não do hook: cada chamada de
 * `useOrigemDeLocalizacao` tem estado próprio, então o convite com hook próprio
 * atualizaria a si mesmo e não a tela que o contém. O teste do `PartidasPerto`
 * pegou isso; aqui a prop deixa o contrato explícito.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import type { OrigemDeLocalizacao } from '../../hooks/useOrigemDeLocalizacao'
import ConviteDeLocalizacao from './index'
import { foiDispensado } from './dispensa'

const CONTEXTO = 'Para mostrar o que tem por perto, precisamos saber de onde você sai.'

function localizacao(over: Partial<OrigemDeLocalizacao> = {}): OrigemDeLocalizacao {
  return {
    origem: null,
    estado: 'sem-origem',
    pedindo: false,
    pedirLocalizacao: vi.fn(),
    podePedir: true,
    ...over,
  }
}

const convite = () => screen.queryByRole('region', { name: /de onde você sai/i })

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('quando o convite aparece', () => {
  it('convida quem não tem origem, com as duas saídas', () => {
    renderWithProviders(<ConviteDeLocalizacao contexto={CONTEXTO} localizacao={localizacao()} />)

    expect(convite()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Usar minha localização/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar meu endereço/ })).toBeInTheDocument()
  })

  it('não aparece para quem já tem origem — nem endereço, nem navegador', () => {
    renderWithProviders(
      <ConviteDeLocalizacao
        contexto={CONTEXTO}
        localizacao={localizacao({
          estado: 'pronto',
          origem: { latitude: -21.24, longitude: -44.99, fonte: 'endereco' },
        })}
      />,
    )

    expect(convite()).not.toBeInTheDocument()
  })

  /**
   * Trocar o convite por outra coisa enquanto o prompt do navegador está aberto
   * mexeria na tela exatamente durante a decisão — e a web#222 registra que é
   * uma chance só.
   */
  it('sai de cena enquanto o navegador pergunta, sem deixar buraco piscando', () => {
    renderWithProviders(
      <ConviteDeLocalizacao contexto={CONTEXTO} localizacao={localizacao({ estado: 'pedindo', pedindo: true })} />,
    )

    expect(convite()).not.toBeInTheDocument()
  })

  it('quem negou continua convidado — pelo endereço, e sem o botão que não funciona mais', () => {
    renderWithProviders(
      <ConviteDeLocalizacao contexto={CONTEXTO} localizacao={localizacao({ estado: 'negado', podePedir: false })} />,
    )

    expect(screen.getByText(/Você não liberou a localização/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Usar minha localização/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar meu endereço/ })).toBeInTheDocument()
  })

  it('navegador sem o recurso não vira erro: sobra o endereço', () => {
    renderWithProviders(
      <ConviteDeLocalizacao
        contexto={CONTEXTO}
        localizacao={localizacao({ estado: 'indisponivel', podePedir: false })}
      />,
    )

    expect(screen.getByText(/Este navegador não informa localização/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('o dispensar', () => {
  it('some da tela e a escolha fica lembrada', async () => {
    const { user } = renderWithProviders(
      <ConviteDeLocalizacao contexto={CONTEXTO} localizacao={localizacao()} />,
    )

    await user.click(screen.getByRole('button', { name: /Dispensar/ }))

    expect(convite()).not.toBeInTheDocument()
    expect(foiDispensado()).toBe(true)
  })

  it('não volta na visita seguinte', () => {
    localStorage.setItem('so-mais-um:convite-de-localizacao', 'dispensado')

    renderWithProviders(<ConviteDeLocalizacao contexto={CONTEXTO} localizacao={localizacao()} />)

    expect(convite()).not.toBeInTheDocument()
  })

  /**
   * O critério pede que ele seja dispensável por teclado. Um `<button>` com
   * `aria-label` dá as duas coisas — foco pela ordem natural e nome
   * anunciado —, mas só enquanto ninguém o trocar por um ícone clicável.
   */
  it('é alcançável pelo teclado', async () => {
    const { user } = renderWithProviders(
      <ConviteDeLocalizacao contexto={CONTEXTO} localizacao={localizacao()} />,
    )

    const dispensar = screen.getByRole('button', { name: /Dispensar/ })
    dispensar.focus()
    expect(dispensar).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(convite()).not.toBeInTheDocument()
  })

  /**
   * Janela anônima, cookies bloqueados, storage cheio. Não conseguir lembrar a
   * dispensa é motivo para convidar de novo — nunca para derrubar a tela.
   */
  it('storage indisponível não quebra o convite', async () => {
    const { user } = renderWithProviders(
      <ConviteDeLocalizacao contexto={CONTEXTO} localizacao={localizacao()} />,
    )

    // A quebra entra só no clique. Aplicada antes do render, ela derruba o
    // `ThemeContext`, que grava o tema na montagem sem `try` — outro assunto,
    // e não o que este teste está medindo.
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('storage cheio')
    }

    try {
      await user.click(screen.getByRole('button', { name: /Dispensar/ }))

      // Some nesta sessão mesmo sem conseguir guardar a escolha.
      expect(convite()).not.toBeInTheDocument()
    } finally {
      Storage.prototype.setItem = original
    }
  })
})
