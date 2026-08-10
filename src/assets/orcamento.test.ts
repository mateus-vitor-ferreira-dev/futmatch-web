/**
 * Orçamento de peso das imagens (#200).
 *
 * O `dist` chegou a ter 4,68 MB em imagens, com `peteca.png` sozinha em 948 kB
 * e `futsal`/`tenis` em 1920x2880 — resolução de retrato grande demais para um
 * fundo que fica atrás de um overlay escuro. Ninguém percebeu porque o
 * carrossel do login carrega uma imagem por vez: o peso não chega de uma vez,
 * chega ao longo dos segundos em que a pessoa está parada na tela de entrada.
 *
 * Este teste é a trava. Sem ele, a próxima imagem pesada entra em silêncio e o
 * ganho se perde de novo.
 *
 * Lê os arquivos por `import.meta.glob` em vez de `node:fs` de propósito: o
 * tsconfig deste projeto declara `types: ["vite/client"]` e não inclui
 * `@types/node`. Trazer os tipos de Node só por causa deste teste liberaria
 * `fs`, `path` e afins para o `src` inteiro, que é código de navegador.
 */
import { describe, it, expect } from 'vitest'

/**
 * `?inline` força o Vite a entregar o asset como data URI, e daí sai o tamanho
 * real em bytes. Com `?url` viria só o caminho, sem peso nenhum para medir.
 */
const modulos = import.meta.glob('./sports/*', {
  eager: true,
  query: '?inline',
  import: 'default',
}) as Record<string, string>

/** Teto por arquivo. Fundo em WebP cabe folgado aqui. */
const TETO_POR_ARQUIVO_KB = 150
/** Teto do conjunto — o que alguém parado na tela de login acaba baixando. */
const TETO_TOTAL_MB = 1

/** Bytes reais por trás de um data URI base64. */
function bytesDoDataUri(uri: string): number {
  const base64 = uri.slice(uri.indexOf(',') + 1)
  const enchimento = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
  return (base64.length * 3) / 4 - enchimento
}

const imagens = Object.entries(modulos).map(([caminho, uri]) => ({
  nome: caminho.replace('./sports/', ''),
  kb: bytesDoDataUri(uri) / 1024,
}))

describe('orçamento de imagens dos esportes', () => {
  it('tem imagem para cada uma das 12 modalidades', () => {
    // Se cair, ou alguém apagou um fundo ou renomeou sem tocar no AuthLayout.
    expect(imagens).toHaveLength(12)
  })

  it('não tem JPG nem PNG', () => {
    // Os dois entram no repositório por hábito; para foto de fundo o WebP
    // custa 50–90% menos sem diferença visível atrás do overlay.
    const foraDoPadrao = imagens.filter((i) => !i.nome.endsWith('.webp')).map((i) => i.nome)
    expect(foraDoPadrao).toEqual([])
  })

  it('nenhuma imagem passa do teto por arquivo', () => {
    const acima = imagens
      .filter((i) => i.kb > TETO_POR_ARQUIVO_KB)
      .map((i) => `${i.nome} (${i.kb.toFixed(0)} kB)`)
    expect(acima, `teto é ${TETO_POR_ARQUIVO_KB} kB por arquivo`).toEqual([])
  })

  it('o conjunto cabe no teto total', () => {
    const mb = imagens.reduce((soma, i) => soma + i.kb, 0) / 1024
    expect(mb, `conjunto tem ${mb.toFixed(2)} MB`).toBeLessThanOrEqual(TETO_TOTAL_MB)
  })
})
