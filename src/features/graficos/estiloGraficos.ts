/** Estilos compartidos por los gráficos. Los colores salen de variables CSS (cambian solos en modo oscuro). */
export const EJE = { fontSize: 12, fill: 'var(--text-muted)' }
export const GRID = 'var(--grid)'
export const DURACION_ANIMACION = 500

export const COLOR_SERIE = {
  ingresos: 'var(--series-1)',
  costos: 'var(--series-2)',
  margen: 'var(--series-3)',
  positivo: 'var(--series-1)',
  negativo: 'var(--neg)',
} as const

export const COLOR_ESTADO: Record<string, string> = {
  Completado: 'var(--good)',
  'Con novedad': 'var(--warning)',
  Cancelado: 'var(--critical)',
}
export const COLOR_ESTADO_DEFECTO = 'var(--series-7)'
