/**
 * Entidad principal del dominio: una operación de transporte ya validada y tipada.
 * El dominio no sabe de dónde vienen los datos (Excel, API, base de datos).
 */
export interface Operacion {
  id: string
  /** Fecha ISO 'YYYY-MM-DD'. Texto para evitar desfases de zona horaria y comparar rangos como cadenas. */
  fecha: string
  zona: string
  ruta: string
  tipoServicio: string
  cliente: string
  vehiculo: string
  kilometros: number
  horasPlaneadas: number
  horasReales: number
  estado: string
  cumpleSla: boolean
  ingresos: number
  costos: number
  /** Siempre ingresos − costos (lo garantiza la capa de datos). */
  margen: number
  calificacion: number
}

/** Dimensiones por las que se puede agrupar o filtrar. */
export type Dimension = 'zona' | 'tipoServicio' | 'cliente' | 'ruta' | 'estado'
