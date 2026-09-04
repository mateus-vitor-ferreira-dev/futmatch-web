import { lazy } from 'react'
import type { ComponentType } from 'react'

/**
 * Registro das páginas: componente lazy + o carregador por trás dele.
 *
 * O `lazy()` esconde o `import()`, e sem acesso a ele não dá para antecipar o
 * download — que é o que a #199 precisa. Aqui o carregador fica exposto ao
 * lado do componente, e `prefetchRota` o dispara no hover.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Carregador<T extends ComponentType<any>> = () => Promise<{ default: T }>

/**
 * Recarrega a página quando um chunk antigo some depois de um deploy.
 *
 * Estava em `routes/index.tsx`; veio junto porque é o mesmo assunto — como um
 * chunk de rota entra na aplicação.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends ComponentType<any>>(carregar: Carregador<T>) {
  return lazy(() => carregar().catch(() => {
    window.location.reload()
    // Promise que nunca resolve: a página está recarregando de qualquer forma.
    return new Promise<{ default: T }>(() => {})
  }))
}

/**
 * Caminho → carregador do chunk.
 *
 * Só rotas estáticas: as com parâmetro (`/torneios/:id`, `/partida/:eventId`,
 * `/owner/places/:placeId/courts`) não aparecem no menu, que é de onde o
 * prefetch parte. Caminho desconhecido simplesmente não faz nada.
 */
const CARREGADORES = {
  // `/` e `/login` carregam o mesmo chunk: a raiz mostra o login para quem não
  // está autenticado, e redireciona quem está. Ver a rota `/` em index.tsx.
  '/':                 () => import('../pages/Register'),
  '/login':            () => import('../pages/Register'),
  '/register':         () => import('../pages/Register'),
  '/esqueci-senha':    () => import('../pages/ForgotPassword'),
  '/redefinir-senha':  () => import('../pages/ResetPassword'),
  '/seja-parceiro':    () => import('../pages/OwnerAccess'),
  '/home':             () => import('../pages/Home'),
  '/perfil':           () => import('../pages/Profile'),
  '/quero-jogar':      () => import('../pages/QueroJogar'),
  '/criar-partida':     () => import('../pages/CriarPartida'),
  '/torneios':         () => import('../pages/Tournaments'),
  '/minhas-partidas':   () => import('../pages/MinhasPartidas'),
  '/historico':        () => import('../pages/Historico'),
  '/avaliacoes':       () => import('../pages/Avaliacoes'),
  '/times':            () => import('../pages/Times'),
  '/amigos':           () => import('../pages/Amigos'),
  '/admin/dashboard':  () => import('../pages/Admin/Dashboard'),
  '/admin/users':      () => import('../pages/Admin/Users'),
  '/admin/requests':   () => import('../pages/Admin/Requests'),
  '/admin/places':     () => import('../pages/Admin/Places'),
  '/owner/dashboard':  () => import('../pages/Owner/Dashboard'),
  '/owner/plans':      () => import('../pages/Owner/Plans'),
  '/owner/places':     () => import('../pages/Owner/Places'),
  '/owner/inventory':  () => import('../pages/Owner/Inventory'),
  '/owner/equipment':  () => import('../pages/Owner/Equipment'),
  '/owner/professores': () => import('../pages/Owner/Professores'),
  '/owner/turmas':     () => import('../pages/Owner/Turmas'),
  '/owner/requests':   () => import('../pages/Owner/Requests'),
} as const

/** Rotas que só redirecionam — o alvo é quem tem chunk. */
const REDIRECIONAMENTOS: Record<string, string> = {
  '/admin': '/admin/dashboard',
  '/owner': '/owner/dashboard',
}

const jaPedidas = new Set<string>()

/**
 * Antecipa o download do chunk de uma rota.
 *
 * Chamada no hover e no focus dos itens de menu. Entre passar o mouse e clicar
 * costumam existir algumas centenas de milissegundos — tempo de rede de graça:
 * quando o clique chega, o JS já está no cache do browser.
 *
 * Medido antes da #199, a 180 ms de RTT: primeira visita a uma rota custava
 * 400–570 ms contra 200 ms de uma revisita, porque a cascata é serial — baixa o
 * chunk, só então o componente monta, só então dispara a API.
 *
 * Idempotente: o Set impede repetir o pedido a cada tremida do mouse. Falha é
 * ignorada de propósito — prefetch é otimização, e o `lazyWithRetry` continua
 * sendo a rede de segurança no clique de verdade.
 */
export function prefetchRota(caminho: string): void {
  const alvo = REDIRECIONAMENTOS[caminho] ?? caminho
  if (jaPedidas.has(alvo)) return

  const carregar = CARREGADORES[alvo as keyof typeof CARREGADORES]
  if (!carregar) return

  jaPedidas.add(alvo)
  carregar().catch(() => {
    // Deixa tentar de novo mais tarde: pode ter sido queda momentânea de rede.
    jaPedidas.delete(alvo)
  })
}

/**
 * A rota já teve o chunk pedido nesta sessão?
 *
 * Existe para o teste poder afirmar o contrato — que o pedido acontece, que
 * acontece uma vez só e que o redirecionamento cai na rota certa — sem
 * precisar espionar `import()`, que não é interceptável.
 */
export function foiPrefetchada(caminho: string): boolean {
  return jaPedidas.has(REDIRECIONAMENTOS[caminho] ?? caminho)
}

/** Só para teste: zera a memória de quem já foi pedido. */
export function limparPrefetch(): void {
  jaPedidas.clear()
}

export const Register         = lazyWithRetry(CARREGADORES['/login'])
export const ForgotPassword   = lazyWithRetry(CARREGADORES['/esqueci-senha'])
export const ResetPassword    = lazyWithRetry(CARREGADORES['/redefinir-senha'])
export const OwnerAccess      = lazyWithRetry(CARREGADORES['/seja-parceiro'])
export const Home             = lazyWithRetry(CARREGADORES['/home'])
export const Profile          = lazyWithRetry(CARREGADORES['/perfil'])
export const QueroJogar       = lazyWithRetry(CARREGADORES['/quero-jogar'])
export const CriarPartida      = lazyWithRetry(CARREGADORES['/criar-partida'])
export const Tournaments      = lazyWithRetry(CARREGADORES['/torneios'])
export const MinhasPartidas    = lazyWithRetry(CARREGADORES['/minhas-partidas'])
export const Historico        = lazyWithRetry(CARREGADORES['/historico'])
export const Avaliacoes       = lazyWithRetry(CARREGADORES['/avaliacoes'])
export const Times            = lazyWithRetry(CARREGADORES['/times'])
export const Amigos           = lazyWithRetry(CARREGADORES['/amigos'])
export const AdminDashboard   = lazyWithRetry(CARREGADORES['/admin/dashboard'])
export const AdminUsers       = lazyWithRetry(CARREGADORES['/admin/users'])
export const AdminRequests    = lazyWithRetry(CARREGADORES['/admin/requests'])
export const AdminPlaces      = lazyWithRetry(CARREGADORES['/admin/places'])
export const OwnerDashboard   = lazyWithRetry(CARREGADORES['/owner/dashboard'])
export const OwnerPlans       = lazyWithRetry(CARREGADORES['/owner/plans'])
export const OwnerPlaces      = lazyWithRetry(CARREGADORES['/owner/places'])
export const OwnerInventory   = lazyWithRetry(CARREGADORES['/owner/inventory'])
export const OwnerEquipment   = lazyWithRetry(CARREGADORES['/owner/equipment'])
export const OwnerRequests    = lazyWithRetry(CARREGADORES['/owner/requests'])

// Rotas com parâmetro: fora do registro porque não partem do menu.
export const PartidaDetail     = lazyWithRetry(() => import('../pages/PartidaDetail'))
export const TimeDetail       = lazyWithRetry(() => import('../pages/TimeDetail'))
export const TournamentDetail = lazyWithRetry(() => import('../pages/TournamentDetail'))
export const Jogador          = lazyWithRetry(() => import('../pages/Jogador'))
export const ConviteDeProfessor = lazyWithRetry(() => import('../pages/ConviteDeProfessor'))
export const ConviteDeEspaco = lazyWithRetry(() => import('../pages/ConviteDeEspaco'))
export const OwnerCourts      = lazyWithRetry(() => import('../pages/Owner/Courts'))
export const OwnerAlunos      = lazyWithRetry(() => import('../pages/Owner/Alunos'))
export const OwnerChamada = lazyWithRetry(() => import('../pages/Owner/Chamada'))
export const OwnerMensalidades = lazyWithRetry(() => import('../pages/Owner/Mensalidades'))
export const OwnerProfessores = lazyWithRetry(CARREGADORES['/owner/professores'])
export const OwnerTurmas = lazyWithRetry(CARREGADORES['/owner/turmas'])
