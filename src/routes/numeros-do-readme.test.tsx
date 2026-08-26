/**
 * O README anuncia "29 rotas sobre 27 páginas carregadas sob demanda". Este
 * teste confere os dois contra o que o app realmente registra.
 *
 * Por que aqui, e não num script
 * ------------------------------
 * Os dois números saem de **módulos**, não de arquivos: a árvore de rotas é
 * percorrida pelo `createRoutesFromElements` do próprio react-router, e as
 * páginas são os exports do `paginas.ts`. Contar `<Route>` por regex sobre o
 * fonte é o erro que a api documenta em `verifica-numeros-do-readme.ts` —
 * quatro issues inválidas nasceram assim (#85, #87, #88, #100).
 *
 * Os números que dependem do relatório do Vitest (total de testes, cobertura)
 * ficam em `scripts/verifica-numeros-do-readme.mjs`, porque um teste não sabe
 * o resultado da própria suíte. Cada número mora onde está a fonte que o prova.
 */

import { describe, it, expect } from 'vitest'
import { createRoutesFromElements, type RouteObject } from 'react-router-dom'

// `?raw` traz o README como string em tempo de build. É o que evita
// `node:fs` num projeto tipado só para o browser — e o Vite invalida o módulo
// quando o arquivo muda, então o teste nunca lê uma versão velha.
import readme from '../../README.md?raw'

import { arvoreDeRotas } from './arvore'
import * as paginas from './paginas'

function urlsDaArvore(): string[] {
  const urls: string[] = []

  const anda = (rotas: RouteObject[], base = '') => {
    for (const rota of rotas) {
      const caminho = rota.path
        ? rota.path.startsWith('/')
          ? rota.path
          : `${base}/${rota.path}`
        : base

      // Rota com filhos é layout: quem é navegável é a folha. `/admin` e
      // `/owner` não têm tela própria — só emprestam o prefixo.
      if (rota.children?.length) anda(rota.children, caminho)
      else if (rota.path) urls.push(caminho)
    }
  }

  anda(createRoutesFromElements(arvoreDeRotas))

  // O catch-all não é rota: é o que sobra quando nenhuma casou.
  return urls.filter((u) => !u.endsWith('*'))
}

function anunciados(padrao: RegExp): number[] {
  return [...readme.matchAll(padrao)].map((m) => Number(m[1]))
}

describe('os números do README', () => {
  it('o total de rotas bate com a árvore que o roteador monta', () => {
    const encontrados = anunciados(/\*\*(\d+) rotas\*\*/g)

    // A contagem de menções importa tanto quanto o valor: uma frase reescrita
    // que escape do padrão é um número que ninguém mais confere.
    expect(encontrados).toHaveLength(1)
    expect(encontrados[0]).toBe(urlsDaArvore().length)
  })

  it('o total de páginas sob demanda bate com o registro do `paginas.ts`', () => {
    const lazy = Object.entries(paginas).filter(
      ([, valor]) => typeof valor === 'object' && valor !== null && '$$typeof' in valor,
    )

    const encontrados = anunciados(/\*\*(\d+) páginas carregadas sob demanda\*\*/g)

    expect(encontrados).toHaveLength(1)
    expect(encontrados[0]).toBe(lazy.length)
  })

  /**
   * O catch-all é o que separa "rota que não existe" de "tela em branco".
   * Se ele sumir, a contagem acima continuaria certa e o app pararia de
   * mandar o desconhecido para o login — sem nada acusar.
   */
  it('existe exatamente um catch-all, e ele não entra na contagem', () => {
    const todas: string[] = []
    const anda = (rotas: RouteObject[]) => {
      for (const r of rotas) {
        if (r.path) todas.push(r.path)
        if (r.children?.length) anda(r.children)
      }
    }
    anda(createRoutesFromElements(arvoreDeRotas))

    expect(todas.filter((p) => p === '*')).toHaveLength(1)
  })
})
