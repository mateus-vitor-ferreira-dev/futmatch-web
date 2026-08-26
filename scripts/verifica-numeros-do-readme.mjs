/**
 * Confere os números do README que saem do relatório da suíte.
 *
 * Portado do `verifica-numeros-do-readme.ts` da api, mesma regra: **cada
 * número vem de uma fonte executável**, e o README é o único lado lido como
 * texto.
 *
 * O que NÃO está aqui, e por quê
 * ------------------------------
 * O total de rotas e o de páginas sob demanda vivem em
 * `src/routes/numeros-do-readme.test.tsx`, porque saem de **módulos**: a
 * árvore de rotas percorrida pelo `createRoutesFromElements` e os exports do
 * `paginas.ts`. Um teste importa esses módulos de graça; um script teria que
 * remontar o pipeline do Vite para chegar neles.
 *
 * Aqui ficam os que a suíte só sabe **depois de rodar** — quantos testes são e
 * quanto do código eles tocam —, que um teste não pode afirmar sobre si mesmo.
 *
 * Uso:
 *   npm run test:ci        # roda a suíte com cobertura e grava os relatórios
 *   npm run readme:check   # confere os números
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const RELATORIO = join(RAIZ, '.vitest-report.json')
const COBERTURA = join(RAIZ, 'coverage/coverage-summary.json')

/** Folga da cobertura, em pontos percentuais. */
const FOLGA_COBERTURA = 2

function lerJson(caminho, comoGerar) {
  if (!existsSync(caminho)) {
    console.error(`\n✗ Relatório não encontrado em ${caminho}\n  Rode antes: ${comoGerar}\n`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(caminho, 'utf8'))
}

const relatorio = lerJson(RELATORIO, 'npm run test:ci')

if (!relatorio.success) {
  console.error('\n✗ O relatório é de uma execução que falhou — conferir números dela não diz nada.\n')
  process.exit(1)
}

const cobertura = lerJson(COBERTURA, 'npm run test:ci')

/**
 * Conferência exata: `esperado` tem que aparecer `ocorrencias` vezes, e todas
 * com o mesmo valor.
 *
 * A contagem de menções importa tanto quanto o valor. Uma frase reescrita que
 * escape do padrão é um número que ninguém mais confere — que é exatamente
 * como o "278 testes" sobreviveu até virar 595.
 */
const conferencias = [
  {
    nome: 'testes',
    esperado: relatorio.numTotalTests,
    fonte: 'numTotalTests do relatório do Vitest',
    padroes: [/\*\*(\d+) testes, ~\d+s\.\*\*/g],
    ocorrencias: 1,
  },
  {
    nome: 'cobertura de linhas (%)',
    esperado: Math.round(cobertura.total.lines.pct),
    fonte: 'total.lines.pct de coverage/coverage-summary.json',
    padroes: [/cobertura de linhas está em \*\*~(\d+)%\*\*/g],
    ocorrencias: 1,
    // O README diz "~62%", e o número real oscila com cada teste novo. Exigir
    // igualdade transformaria a conferência num pedido de commit a cada PR —
    // e uma conferência que atrapalha é uma conferência que alguém remove.
    folga: FOLGA_COBERTURA,
  },
]

function conferir(readme, c) {
  const achados = c.padroes.flatMap((p) => [...readme.matchAll(p)].map((m) => Number(m[1])))
  const problemas = []

  if (achados.length !== c.ocorrencias) {
    problemas.push(
      `${c.nome}: o README menciona esse número ${achados.length}× e a conferência espera ${c.ocorrencias}×.\n` +
        `    Alguma menção foi reescrita e saiu do radar — ajuste os padrões em scripts/verifica-numeros-do-readme.mjs.`,
    )
  }

  const folga = c.folga ?? 0
  const divergentes = [...new Set(achados.filter((n) => Math.abs(n - c.esperado) > folga))]

  if (divergentes.length > 0) {
    const alvo = folga ? `${c.esperado} ±${folga}` : `${c.esperado}`
    problemas.push(`${c.nome}: esperado ${alvo} ≠ encontrado ${divergentes.join(', ')}  (fonte: ${c.fonte})`)
  }

  return problemas
}

const readme = readFileSync(join(RAIZ, 'README.md'), 'utf8')
const problemas = conferencias.flatMap((c) => conferir(readme, c))

if (problemas.length > 0) {
  console.error(`\n✗ O README está desatualizado em ${problemas.length} ponto(s):\n`)
  for (const p of problemas) console.error(`  ${p}`)
  console.error('\n  Corrija os números no README.md — são a primeira coisa que alguém de fora lê.\n')
  process.exit(1)
}

console.warn(`\n✓ Números do README conferem: ${conferencias.map((c) => `${c.esperado} ${c.nome}`).join(' · ')}\n`)
