const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const num = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })
const pct = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 1 })

/** $ 1.234.567 */
export const fmtCOP = (n: number) => cop.format(n)

/** $ 134,4 M — para tarjetas y ejes */
export function fmtCOPCorto(n: number): string {
  const abs = Math.abs(n)
  const signo = n < 0 ? '−' : ''
  if (abs >= 1e9) return `${signo}$ ${num.format(abs / 1e9)} mil M`
  if (abs >= 1e6) return `${signo}$ ${num.format(abs / 1e6)} M`
  if (abs >= 1e3) return `${signo}$ ${num.format(abs / 1e3)} mil`
  return `${signo}$ ${num.format(abs)}`
}

export const fmtNum = (n: number) => num.format(n)
export const fmtPct = (n: number | null) => (n == null ? '—' : pct.format(n))

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** '2025-03' → 'mar 25' */
export function fmtMes(iso: string): string {
  const [y, m] = iso.split('-')
  return `${MESES[Number(m) - 1]} ${y.slice(2)}`
}

/** '2025-03-14' → '14/03/2025' */
export function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
