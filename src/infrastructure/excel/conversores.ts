/**
 * Conversores puros de valores de celda → tipos del dominio.
 * No dependen de SheetJS, así que se pueden probar de forma aislada.
 */

const pad = (n: number) => String(n).padStart(2, '0')
const MS_POR_DIA = 86_400_000
/** Día 0 del sistema de fechas de Excel (incluye el famoso bug del 29/02/1900). */
const EPOCA_EXCEL_UTC = Date.UTC(1899, 11, 30)

/**
 * Convierte el valor de una celda de fecha a 'YYYY-MM-DD'.
 * - Número de serie de Excel (lo normal): se calcula en UTC para que la zona
 *   horaria del navegador no corra la fecha un día.
 * - Texto 'YYYY-MM-DD' o 'DD/MM/YYYY' (formato colombiano).
 */
export function aFechaISO(valor: unknown): string | null {
  if (typeof valor === 'number' && Number.isFinite(valor) && valor > 0) {
    const fecha = new Date(EPOCA_EXCEL_UTC + Math.floor(valor) * MS_POR_DIA)
    return fecha.toISOString().slice(0, 10)
  }
  if (typeof valor === 'string') {
    const t = valor.trim()
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (m) return validarFecha(+m[1], +m[2], +m[3])
    m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) return validarFecha(+m[3], +m[2], +m[1])
  }
  return null
}

function validarFecha(y: number, m: number, d: number): string | null {
  const f = new Date(Date.UTC(y, m - 1, d))
  const valida = f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d
  return valida ? `${y}-${pad(m)}-${pad(d)}` : null
}

/** Acepta números o textos como "1.234.567", "$ 1,234" o "12,5". */
export function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  if (typeof valor !== 'string') return null
  const limpio = valor.replace(/[^\d,.-]/g, '')
  if (!limpio || limpio === '-') return null
  const ultimaComa = limpio.lastIndexOf(',')
  const ultimoPunto = limpio.lastIndexOf('.')
  let normal: string
  if (ultimaComa > ultimoPunto) {
    // La coma es decimal ("1.234,5") salvo que sea separador de miles ("1,234")
    normal = /,\d{3}$/.test(limpio) && ultimoPunto === -1 ? limpio.replace(/,/g, '') : limpio.replace(/\./g, '').replace(',', '.')
  } else if (ultimaComa === -1 && /^-?\d{1,3}(\.\d{3})+$/.test(limpio)) {
    // Convención colombiana: puntos seguidos de grupos de 3 dígitos son miles ("496.778", "1.234.567")
    normal = limpio.replace(/\./g, '')
  } else {
    // El punto es decimal ("2.2", "1,234.5")
    normal = limpio.replace(/,/g, '')
  }
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}

export const aTexto = (v: unknown): string => (v == null ? '' : String(v).trim())

/** "Sí", "si", "SI", "yes", true, 1 → true */
export function aBooleano(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  const t = aTexto(v)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  if (['si', 'yes', 'true', '1', 's'].includes(t)) return true
  if (['no', 'false', '0', 'n'].includes(t)) return false
  return null
}
