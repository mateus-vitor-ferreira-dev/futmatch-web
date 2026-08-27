/**
 * A memória do "não, obrigado".
 *
 * Em arquivo próprio porque a regra `react-refresh/only-export-components`
 * recusa função exportada ao lado de componente — a mesma separação que a
 * árvore de rotas teve que fazer entre `paginas.ts` e `index.tsx`.
 *
 * A escolha vive no `localStorage`, e não em estado de sessão: convite que
 * volta a cada visita depois de recusado é o que ensina a pessoa a não ler o
 * que o app mostra. É o mesmo tratamento que a preferência de localização já
 * recebe em `useOrigemDeLocalizacao`.
 */

/** Mesma prateleira da preferência de localização (`so-mais-um:localizacao`). */
const CHAVE = 'so-mais-um:convite-de-localizacao'

export function foiDispensado(): boolean {
  try {
    return localStorage.getItem(CHAVE) === 'dispensado'
  } catch {
    // Janela anônima, cookies bloqueados, storage cheio. Não conseguir lembrar
    // é motivo para convidar de novo, nunca para quebrar a tela.
    return false
  }
}

export function guardeDispensa() {
  try {
    localStorage.setItem(CHAVE, 'dispensado')
  } catch {
    // Sem registro, o convite volta na próxima visita. Pior que lembrar, muito
    // melhor que estourar.
  }
}
