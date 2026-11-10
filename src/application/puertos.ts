import type { Operacion } from '@/domain'

/** Resultado de cargar datos desde cualquier fuente. */
export interface ResultadoCarga {
  operaciones: Operacion[]
  /** Descripción de la fuente (p. ej. nombre de la hoja de Excel) */
  origen: string
  filasLeidas: number
  advertencias: string[]
}

/**
 * Puerto (interfaz) de acceso a datos. La aplicación depende de este contrato,
 * no de Excel. Hoy se implementa con ExcelOperacionesRepository; mañana puede
 * existir un ApiOperacionesRepository sin tocar componentes ni reglas de negocio.
 */
export interface OperacionesRepository<TFuente = unknown> {
  cargar(fuente: TFuente): Promise<ResultadoCarga>
}

export type CodigoErrorCarga =
  | 'FORMATO_NO_SOPORTADO'
  | 'ARCHIVO_ILEGIBLE'
  | 'HOJA_NO_ENCONTRADA'
  | 'COLUMNAS_FALTANTES'
  | 'SIN_REGISTROS_VALIDOS'

/** Error de carga con un código estable (útil para pruebas, logs o traducciones). */
export class ErrorCarga extends Error {
  readonly codigo: CodigoErrorCarga
  constructor(codigo: CodigoErrorCarga, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorCarga'
    this.codigo = codigo
  }
}
