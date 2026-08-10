/**
 * Regressão da #199.
 *
 * A cascata de uma primeira visita é serial: baixa o chunk da rota, só então o
 * componente monta, só então dispara a API. Medido a 180 ms de RTT, isso dava
 * 400–570 ms contra 200 ms de uma rota com chunk já em cache. O hover acontece
 * centenas de milissegundos antes do clique — é esse tempo que o prefetch usa.
 *
 * `import()` não é interceptável, então o teste afirma o contrato pelo estado
 * que `prefetchRota` mantém: qual rota foi pedida, e se foi pedida uma vez só.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { foiPrefetchada, limparPrefetch, prefetchRota } from './paginas'

beforeEach(() => {
  limparPrefetch()
})

describe('prefetchRota', () => {
  it('pede o chunk de uma rota do menu', () => {
    expect(foiPrefetchada('/home')).toBe(false)

    prefetchRota('/home')

    expect(foiPrefetchada('/home')).toBe(true)
  })

  it('não marca caminho fora do registro', () => {
    prefetchRota('/rota-que-nao-existe')
    prefetchRota('')

    expect(foiPrefetchada('/rota-que-nao-existe')).toBe(false)
    expect(foiPrefetchada('')).toBe(false)
  })

  it('segue o redirecionamento até a rota que tem chunk', () => {
    // /admin e /owner só redirecionam; quem carrega é o dashboard de cada um.
    // Sem esse desvio, passar o mouse em "Painel Admin" não adiantaria nada.
    prefetchRota('/admin')
    prefetchRota('/owner')

    expect(foiPrefetchada('/admin/dashboard')).toBe(true)
    expect(foiPrefetchada('/owner/dashboard')).toBe(true)
  })

  it('não repete o pedido quando o mouse treme sobre o item', () => {
    prefetchRota('/perfil')
    const depoisDaPrimeira = foiPrefetchada('/perfil')

    // mouseenter dispara várias vezes num hover real
    prefetchRota('/perfil')
    prefetchRota('/perfil')

    expect(depoisDaPrimeira).toBe(true)
    expect(foiPrefetchada('/perfil')).toBe(true)
  })

  it('cobre no registro toda rota estática que aparece no menu', async () => {
    // Prende o registro aos menus: item novo na sidebar sem entrada aqui
    // silenciosamente não teria prefetch, e ninguém perceberia.
    const { adminNavItems, ownerNavItems } = await import('../constants/navItems')
    const doJogador = [
      '/home', '/quero-jogar', '/criar-pelada', '/torneios',
      '/minhas-peladas', '/historico', '/avaliacoes', '/perfil',
    ]
    const doPainel = [...adminNavItems, ...ownerNavItems('ADMIN')].map((i) => i.to)

    for (const caminho of [...doJogador, ...doPainel]) {
      limparPrefetch()
      prefetchRota(caminho)
      expect(foiPrefetchada(caminho), `sem prefetch para ${caminho}`).toBe(true)
    }
  })
})
