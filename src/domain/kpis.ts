import type { Operacion } from './operacion'
import { esEjecutada, SLA_EXCLUYE_CANCELADAS } from './reglas'

export interface Kpis {
  operaciones: number
  porEstado: Record<string, number>
  ingresos: number
  costos: number
  margen: number
  /** margen / ingresos; null si no hay ingresos */
  margenPct: number | null
  /** Base sobre la que se mide el SLA (ver reglas.ts) */
  baseSla: number
  cumplenSla: number
  slaPct: number | null
  calificacionProm: number | null
  kilometros: number
}

const ratio = (a: number, b: number) => (b ? a / b : null)

/** Calcula todos los indicadores en una sola pasada sobre los datos. */
export function calcularKpis(ops: readonly Operacion[]): Kpis {
  let ingresos = 0
  let costos = 0
  let kilometros = 0
  let sumaCalificacion = 0
  let baseSla = 0
  let cumplenSla = 0
  const porEstado: Record<string, number> = {}

  for (const o of ops) {
    ingresos += o.ingresos
    costos += o.costos
    kilometros += o.kilometros
    sumaCalificacion += o.calificacion
    porEstado[o.estado] = (porEstado[o.estado] ?? 0) + 1
    if (!SLA_EXCLUYE_CANCELADAS || esEjecutada(o)) {
      baseSla++
      if (o.cumpleSla) cumplenSla++
    }
  }

  const margen = ingresos - costos
  return {
    operaciones: ops.length,
    porEstado,
    ingresos,
    costos,
    margen,
    margenPct: ratio(margen, ingresos),
    baseSla,
    cumplenSla,
    slaPct: ratio(cumplenSla, baseSla),
    calificacionProm: ratio(sumaCalificacion, ops.length),
    kilometros,
  }
}
