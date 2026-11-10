import type { Operacion } from './operacion'

/**
 * Reglas de negocio centralizadas. Si el negocio cambia un criterio,
 * se cambia aquí y se refleja en KPIs, gráficos y pruebas.
 */

export const ESTADOS = {
  completado: 'Completado',
  conNovedad: 'Con novedad',
  cancelado: 'Cancelado',
} as const

/** Una operación cancelada no se ejecutó, así que no se mide su cumplimiento de tiempos. */
export const esEjecutada = (o: Operacion) => o.estado !== ESTADOS.cancelado

/**
 * Política del SLA: se calcula sobre las operaciones ejecutadas.
 * En el archivo de la prueba todas las canceladas tienen SLA = No; incluirlas
 * castigaría el indicador por algo que no es un tema de tiempos (55,6% vs 63,6%).
 */
export const SLA_EXCLUYE_CANCELADAS = true

export const ESCALA_CALIFICACION = { min: 1, max: 5 } as const
