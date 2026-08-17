import {
  LayoutDashboard, Users, ClipboardList, Building2, Home, Store, ShieldCheck, CreditCard, Package, Dumbbell,
} from 'lucide-react'
import type { NavItemDef } from '../components/DashboardLayout'
import type { PlanFeature, UserRole } from '../types/api'

/**
 * Navegação lateral dos painéis de admin e owner, em um lugar só.
 *
 * O menu estava replicado em oito arquivos — uma cópia em cada página dos dois
 * painéis — e as cópias já haviam divergido: a do Owner/Dashboard chamava o
 * item de "Estabelecimentos" e o listava depois de "Solicitações", enquanto as
 * outras três diziam "Meus Estabelecimentos" e o traziam antes. O menu mudava
 * de forma conforme a página aberta.
 *
 * Os itens de visão geral apontam para `/admin/dashboard` e `/owner/dashboard`,
 * e não para `/admin` e `/owner`. Estas duas últimas são apenas
 * redirecionamentos (`routes/index.tsx`), então o usuário nunca permanece
 * nelas — e um NavLink com `end` apontando para lá jamais receberia a classe
 * `.active`.
 */
export const adminNavItems: NavItemDef[] = [
  { to: '/admin/dashboard', label: 'Visão Geral',        icon: LayoutDashboard, end: true },
  { to: '/admin/users',     label: 'Gestão de Usuários', icon: Users           },
  { to: '/admin/requests',  label: 'Solicitações',       icon: ClipboardList   },
  { to: '/admin/places',    label: 'Estabelecimentos',   icon: Building2       },
  { to: '/owner',           label: 'Painel do Owner',    icon: Store, divider: true },
  { to: '/home',            label: 'Área do Jogador',    icon: Home },
]

/**
 * Menu do owner. Ganha um atalho para o painel admin quando quem acessa é ADMIN, e
 * marca com cadeado o que o plano assinado não abre.
 *
 * **Item bloqueado não some.** Ele fica visível, esmaecido, e o clique leva para a
 * tela de planos — é assim que o dono descobre que a funcionalidade existe. Esconder
 * o que ele poderia comprar não vende nada e ainda o deixa achando que o produto não
 * faz aquilo.
 *
 * Visão Geral, Planos, Meus Estabelecimentos e Solicitações **nunca** são bloqueados:
 * são como o dono entra na plataforma, o que ele já contratou e como ele paga. A
 * Visão Geral entra na lista porque a página existe para todo mundo — o que depende de
 * plano são as estatísticas dentro dela, e quem barra isso é a própria página.
 */
export function ownerNavItems(
  role: UserRole | undefined,
  temFuncionalidade: (funcionalidade: PlanFeature) => boolean = () => true,
): NavItemDef[] {
  return [
    { to: '/owner/dashboard', label: 'Visão Geral',           icon: LayoutDashboard, end: true },
    { to: '/owner/plans',     label: 'Planos',                 icon: CreditCard      },
    { to: '/owner/places',    label: 'Meus Estabelecimentos', icon: Building2       },
    { to: '/owner/inventory', label: 'Estoque',                icon: Package,
      bloqueado: !temFuncionalidade('ESTOQUE') },
    { to: '/owner/equipment', label: 'Equipamentos',          icon: Dumbbell,
      bloqueado: !temFuncionalidade('EQUIPAMENTOS') },
    { to: '/owner/requests',  label: 'Solicitações',          icon: ClipboardList   },
    ...(role === 'ADMIN'
      ? [{ to: '/admin', label: 'Painel Admin', icon: ShieldCheck, divider: true }]
      : []),
    { to: '/home',            label: 'Área do Jogador',       icon: Home, divider: role !== 'ADMIN' },
  ]
}
