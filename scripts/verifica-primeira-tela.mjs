/**
 * A primeira tela não pode carregar componente de rota autenticada.
 *
 * O que esta conferência guarda
 * -----------------------------
 * A #317 nasceu de um barrel: `src/components/index.ts` exportava dezoito
 * componentes, e três telas de autenticação importavam campos de formulário
 * por ele. Como o barrel entra inteiro, o Rollup criava um chunk compartilhado
 * `components-*.js` de 172 KiB — com Leaflet dentro — que a raiz sem sessão
 * baixava antes de qualquer login. O Lighthouse marcou 77% dele como não
 * usado.
 *
 * O barrel saiu. O que fica guardado aqui é o **contrato**, não a remoção: se
 * alguém recriar um barrel amplo, ou importar `Map` numa tela de login, o
 * chunk volta e o build fica maior sem nada acusar — o app continua correto,
 * só que lento, e lentidão não quebra teste nenhum.
 *
 * Como ela olha
 * -------------
 * Percorre os `import` **estáticos** a partir da entrada e das telas sem
 * sessão, parando em cada `import()` — que é exatamente onde o bundler corta o
 * chunk. O `paginas.ts` só tem `import()`, e é por isso que a entrada estática
 * não arrasta nenhuma página junto.
 *
 * Por que um script, e não um teste
 * ---------------------------------
 * Mesma regra do `verifica-numeros-do-readme.mjs`: cada conferência mora onde
 * está a fonte que a prova. Esta lê **arquivos**, não módulos — e as duas
 * formas de ler arquivo de dentro da suíte custam caro:
 *
 * - `import.meta.glob('?raw')` mente na cobertura. O módulo que o Vite gera
 *   para cada `?raw` é uma linha executada, e o v8 a mapeia de volta para o
 *   arquivo original: cada arquivo lido como texto passa a contar como
 *   coberto. Medido: a suíte saltava de 61% para 74% de linhas sem ninguém ter
 *   escrito um teste — e o README anuncia esse número.
 * - `node:fs` exigiria `@types/node`, que é justamente o que o projeto evita
 *   para continuar tipado só para o browser.
 *
 * Aqui, fora do pipeline do Vite, nenhum dos dois problemas existe.
 *
 * Uso:
 *   npm run primeira-tela:check
 */

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/** A entrada estática do app: o que existe antes de qualquer rota resolver. */
const ENTRADA = '/src/main.tsx'

/**
 * As telas que a pessoa vê sem sessão. A raiz mostra `Register`; as outras
 * três são alcançáveis por link a partir dela, sem autenticar.
 */
const TELAS_SEM_SESSAO = [
  '/src/pages/Register/index.tsx',
  '/src/pages/ForgotPassword/index.tsx',
  '/src/pages/ResetPassword/index.tsx',
  '/src/pages/OwnerAccess/index.tsx',
]

/** Pacotes pesados que não têm o que fazer antes do login. */
const PACOTES_PROIBIDOS = ['leaflet', 'react-leaflet']

/**
 * Componentes que só fazem sentido depois do login.
 *
 * `DashboardLayout` fica fora da lista de propósito: quem o importa é a árvore
 * de rotas (`arvore.tsx`), que é entrada estática por definição — o roteador
 * precisa do elemento de layout para casar a URL. Tirá-lo de lá é outro
 * assunto, e não tem nada a ver com o barrel.
 */
const COMPONENTES_PROIBIDOS = [
  'Map',
  'TournamentBracket',
  'TournamentRegistrations',
  'SorteioDeTimes',
  'LancarPlacar',
  'PartidasParaApitar',
  'RequisitosDaPartida',
  'StatCard',
]

/**
 * O que a travessia precisa alcançar para provar que está funcionando.
 *
 * Sem isto, um erro de resolução deixaria o alcance quase vazio e as regras
 * acima passariam por engano — a conferência diria "nada demais é carregado"
 * justamente por não estar carregando nada.
 */
const ALCANCE_ESPERADO = [
  '/src/components/PasswordInput/index.tsx',
  '/src/components/PhoneInput/index.tsx',
  '/src/components/SportSelect/index.tsx',
  '/src/components/AuthLayout/index.tsx',
]

/** Todo o fonte de `src/`, indexado por caminho de projeto: `/src/pages/...`. */
function carregarFontes() {
  const fontes = {}

  const anda = (diretorio) => {
    for (const entrada of readdirSync(join(RAIZ, diretorio), { withFileTypes: true })) {
      const caminho = `${diretorio}/${entrada.name}`
      if (entrada.isDirectory()) anda(caminho)
      else if (/\.tsx?$/.test(entrada.name)) fontes[`/${caminho}`] = readFileSync(join(RAIZ, caminho), 'utf8')
    }
  }

  anda('src')
  return fontes
}

const FONTES = carregarFontes()

/**
 * `import ... from '...'` e `export ... from '...'`, inclusive quebrados em
 * várias linhas. `import type` fica de fora: some na compilação, não pesa byte
 * nenhum no bundle. `import(` não casa porque não tem `from`.
 */
const COM_FROM = /(?:^|\n)\s*(?:import|export)(?!\s+type\b)[^;'"]*?from\s*['"]([^'"]+)['"]/g

/** `import 'leaflet/dist/leaflet.css'` — sem binding, mas com efeito e peso. */
const SO_EFEITO = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g

function especificadores(fonte) {
  return [
    ...[...fonte.matchAll(COM_FROM)].map((m) => m[1]),
    ...[...fonte.matchAll(SO_EFEITO)].map((m) => m[1]),
  ]
}

/** Caminho relativo → chave de `FONTES`. Devolve `null` quando é pacote do npm. */
function resolver(deQuem, especificador) {
  if (!especificador.startsWith('.')) return null

  const base = new URL(especificador.split('?')[0], `file://${deQuem}`).pathname

  for (const sufixo of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (FONTES[base + sufixo] !== undefined) return base + sufixo
  }
  return null
}

/** `@escopo/pacote/sub` → `@escopo/pacote`; `leaflet/dist/x.css` → `leaflet`. */
function nomeDoPacote(especificador) {
  const partes = especificador.split('/')
  return especificador.startsWith('@') ? partes.slice(0, 2).join('/') : partes[0]
}

/** O que o browser baixa junto com estas raízes, parando em cada `import()`. */
function alcanceEstatico(raizes) {
  const modulos = new Set()
  const pacotes = new Set()
  const fila = [...raizes]

  while (fila.length > 0) {
    const atual = fila.pop()
    if (modulos.has(atual)) continue
    modulos.add(atual)

    for (const especificador of especificadores(FONTES[atual])) {
      const alvo = resolver(atual, especificador)
      if (alvo === null) pacotes.add(nomeDoPacote(especificador))
      else fila.push(alvo)
    }
  }

  return { modulos, pacotes }
}

const raizes = [ENTRADA, ...TELAS_SEM_SESSAO]
const problemas = []

for (const raiz of raizes) {
  if (FONTES[raiz] === undefined) {
    problemas.push(
      `${raiz} não existe.\n` +
        '    A tela foi renomeada ou movida — atualize as raízes em scripts/verifica-primeira-tela.mjs.',
    )
  }
}

if (problemas.length === 0) {
  const { modulos, pacotes } = alcanceEstatico(raizes)

  const naoAlcancados = ALCANCE_ESPERADO.filter((m) => !modulos.has(m))
  if (naoAlcancados.length > 0) {
    problemas.push(
      `a travessia não alcançou ${naoAlcancados.join(', ')}.\n` +
        '    Ou a tela mudou de forma, ou a resolução de import quebrou — e uma travessia\n' +
        '    quebrada aprova qualquer coisa. Conserte isto antes de olhar o resto.',
    )
  }

  for (const pacote of PACOTES_PROIBIDOS.filter((p) => pacotes.has(p))) {
    problemas.push(
      `\`${pacote}\` é alcançado pela primeira tela.\n` +
        '    Ele deve ser baixado só por quem renderiza mapa: importe por `import()`\n' +
        '    dentro da tela que o mostra.',
    )
  }

  const infiltrados = COMPONENTES_PROIBIDOS.filter((n) => modulos.has(`/src/components/${n}/index.tsx`))
  for (const nome of infiltrados) {
    problemas.push(
      `\`${nome}\` é alcançado pela primeira tela.\n` +
        '    É componente de rota autenticada: quem não fez login não deveria baixá-lo.',
    )
  }

  if (FONTES['/src/components/index.ts'] !== undefined) {
    problemas.push(
      'o barrel `src/components/index.ts` voltou.\n' +
        '    Ele foi removido na #317 porque juntava componente de login e de rota\n' +
        '    autenticada no mesmo chunk. Importe cada componente pelo caminho dele.',
    )
  }
}

if (problemas.length > 0) {
  console.error(`\n✗ A primeira tela regrediu em ${problemas.length} ponto(s):\n`)
  for (const p of problemas) console.error(`  ${p}`)
  console.error('\n  A medição que motivou esta regra está em docs/PERFORMANCE-317-SEM-BARREL.md.\n')
  process.exit(1)
}

const { modulos, pacotes } = alcanceEstatico(raizes)
console.warn(
  `\n✓ A primeira tela alcança ${modulos.size} módulos e ${pacotes.size} pacotes,` +
    ' nenhum deles de rota autenticada.\n',
)
