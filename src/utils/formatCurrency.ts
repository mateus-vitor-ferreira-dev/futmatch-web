const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Centavos (como a API guarda o preço do plano) para "R$ 79,90". */
export function formatarPrecoCentavos(centavos: number): string {
  return formatador.format(centavos / 100)
}
