import type { Operacion } from '@/domain'
import { ErrorCarga, type OperacionesRepository, type ResultadoCarga } from '@/application/puertos'
import { leerHoja, type FilaCruda } from './lectorExcel'
import { COLUMNAS, COLUMNAS_REQUERIDAS, esquemaFila } from './esquemaFila'

const EXTENSIONES = /\.(xlsx|xls)$/i
const MAX_DETALLES = 5

/** Fuente aceptada: un File del navegador o un ArrayBuffer (p. ej. el archivo de ejemplo). */
export type FuenteExcel = File | ArrayBuffer

/** Traduce una fila cruda (encabezados de Excel) a los nombres de campo del dominio. */
const aCamposDominio = (fila: FilaCruda) =>
  Object.fromEntries(Object.entries(COLUMNAS).map(([campo, columna]) => [campo, fila[columna]]))

const filaVacia = (fila: FilaCruda) => Object.values(fila).every((v) => v == null || String(v).trim() === '')

/**
 * Implementación del puerto OperacionesRepository para archivos Excel.
 * Pipeline: leer hoja → validar columnas → validar cada fila (zod) → reglas de integridad → Operacion[]
 */
export class ExcelOperacionesRepository implements OperacionesRepository<FuenteExcel> {
  async cargar(fuente: FuenteExcel): Promise<ResultadoCarga> {
    if (fuente instanceof File && !EXTENSIONES.test(fuente.name)) {
      throw new ErrorCarga('FORMATO_NO_SOPORTADO', 'El archivo debe ser de Excel (.xlsx o .xls).')
    }
    const buffer = fuente instanceof ArrayBuffer ? fuente : await fuente.arrayBuffer()
    const { hoja, filas } = leerHoja(buffer, { hojaPreferida: 'Datos', columnaClave: COLUMNAS.id })
    return this.procesar(hoja, filas)
  }

  /** Separado de `cargar` para poder probarlo con filas en memoria, sin archivo. */
  procesar(hoja: string, filas: FilaCruda[]): ResultadoCarga {
    if (!filas.length) throw new ErrorCarga('SIN_REGISTROS_VALIDOS', `La hoja "${hoja}" no tiene registros.`)

    const faltantes = COLUMNAS_REQUERIDAS.filter((c) => !(c in filas[0]))
    if (faltantes.length) {
      throw new ErrorCarga('COLUMNAS_FALTANTES', `Al archivo le faltan columnas obligatorias: ${faltantes.join(', ')}.`)
    }

    const operaciones: Operacion[] = []
    const errores: string[] = []
    const duplicados: string[] = []
    const idsVistos = new Set<string>()
    let margenesCorregidos = 0

    filas.forEach((fila, i) => {
      if (filaVacia(fila)) return // filas en blanco al final de la hoja
      const numFila = i + 2 // +1 por el encabezado, +1 porque Excel cuenta desde 1

      const r = esquemaFila.safeParse(aCamposDominio(fila))
      if (!r.success) {
        const detalle = r.error.issues
          .map((iss) => `${COLUMNAS[iss.path[0] as keyof typeof COLUMNAS] ?? iss.path.join('.')} ${iss.message}`)
          .join('; ')
        errores.push(`fila ${numFila}: ${detalle}`)
        return
      }

      const { margen: margenArchivo, ...datos } = r.data
      if (idsVistos.has(datos.id)) {
        duplicados.push(`${datos.id} (fila ${numFila})`)
        return
      }
      idsVistos.add(datos.id)

      // Regla de integridad: el margen siempre es ingresos − costos.
      const margen = datos.ingresos - datos.costos
      if (margenArchivo !== undefined && Math.abs(margenArchivo - margen) > 1) margenesCorregidos++

      operaciones.push({ ...datos, margen })
    })

    if (!operaciones.length) {
      throw new ErrorCarga(
        'SIN_REGISTROS_VALIDOS',
        `Ninguna fila tiene datos válidos. Ejemplo: ${errores[0] ?? 'sin detalle'}.`,
      )
    }

    const advertencias: string[] = []
    if (errores.length) {
      const extra = errores.length > MAX_DETALLES ? ` (y ${errores.length - MAX_DETALLES} más)` : ''
      advertencias.push(
        `${errores.length} fila(s) descartada(s) por datos inválidos: ${errores.slice(0, MAX_DETALLES).join(' | ')}${extra}.`,
      )
    }
    if (duplicados.length) {
      advertencias.push(`${duplicados.length} ID(s) duplicado(s), se conservó la primera aparición: ${duplicados.slice(0, MAX_DETALLES).join(', ')}.`)
    }
    if (margenesCorregidos) {
      advertencias.push(`${margenesCorregidos} fila(s) con Margen_COP distinto de Ingresos − Costos; se usó el valor recalculado.`)
    }

    operaciones.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id))
    return { operaciones, origen: hoja, filasLeidas: filas.length, advertencias }
  }
}
