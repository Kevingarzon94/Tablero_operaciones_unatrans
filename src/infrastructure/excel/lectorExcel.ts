import * as XLSX from 'xlsx'
import { ErrorCarga } from '@/application/puertos'

/**
 * Adaptador de SheetJS: es el ÚNICO archivo que importa la librería 'xlsx'.
 * Si se cambia de librería (p. ej. exceljs), solo se reemplaza este archivo.
 */

export type FilaCruda = Record<string, unknown>

export interface HojaLeida {
  hoja: string
  filas: FilaCruda[]
}

const normalizar = (s: unknown) => String(s ?? '').trim()

/** Busca la hoja "Datos"; si no existe, la primera cuyo encabezado contenga la columna clave. */
function encontrarHoja(wb: XLSX.WorkBook, nombrePreferido: string, columnaClave: string): string | null {
  const porNombre = wb.SheetNames.find((n) => normalizar(n).toLowerCase() === nombrePreferido.toLowerCase())
  if (porNombre) return porNombre
  return (
    wb.SheetNames.find((n) => {
      const [encabezado] = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1 })
      return Array.isArray(encabezado) && encabezado.map(normalizar).includes(columnaClave)
    }) ?? null
  )
}

export function leerHoja(
  buffer: ArrayBuffer,
  opciones: { hojaPreferida: string; columnaClave: string },
): HojaLeida {
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buffer, { type: 'array' })
  } catch {
    throw new ErrorCarga('ARCHIVO_ILEGIBLE', 'El archivo está dañado o no es un Excel válido.')
  }

  const hoja = encontrarHoja(wb, opciones.hojaPreferida, opciones.columnaClave)
  if (!hoja) {
    throw new ErrorCarga(
      'HOJA_NO_ENCONTRADA',
      `No se encontró la hoja "${opciones.hojaPreferida}" ni una hoja con la columna ${opciones.columnaClave}. Hojas del archivo: ${wb.SheetNames.join(', ')}.`,
    )
  }

  // defval: null conserva las columnas vacías; los encabezados se limpian de espacios.
  const filas = XLSX.utils
    .sheet_to_json<FilaCruda>(wb.Sheets[hoja], { defval: null })
    .map((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [normalizar(k), v])))

  return { hoja, filas }
}
