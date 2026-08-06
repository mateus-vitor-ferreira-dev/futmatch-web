/**
 * Formata telefone brasileiro enquanto o usuário digita.
 * Celular (11 dígitos): (XX) XXXXX-XXXX
 * Fixo   (10 dígitos): (XX) XXXX-XXXX
 */
export function formatPhoneBR(value: string | number | null | undefined): string {
  const d = String(value ?? '').replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
