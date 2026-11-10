import type { Dimension, Operacion } from './operacion'
import { calcularKpis } from './kpis'

/* ---------- Serie mensual ---------- */

export interface PuntoMensual {
  mes: string // 'YYYY-MM'
  ingresos: number
  costos: number
  margen: number
  operaciones: number
}

const siguienteMes = (mes: string) => {
  const [y, m] = mes.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

/** Agrupa por mes y rellena los meses sin operaciones con ceros para que la línea no salte. */
export function serieMensual(ops: readonly Operacion[]): PuntoMensual[] {
  if (!ops.length) return []
  const porMes = new Map<string, PuntoMensual>()
  for (const o of ops) {
    const mes = o.fecha.slice(0, 7)
    const p = porMes.get(mes) ?? { mes, ingresos: 0, costos: 0, margen: 0, operaciones: 0 }
    p.ingresos += o.ingresos
    p.costos += o.costos
    p.margen += o.margen
    p.operaciones++
    porMes.set(mes, p)
  }
  const meses = [...porMes.keys()].sort()
  const ultimo = meses[meses.length - 1]
  const salida: PuntoMensual[] = []
  for (let mes = meses[0]; mes <= ultimo; mes = siguienteMes(mes)) {
    salida.push(porMes.get(mes) ?? { mes, ingresos: 0, costos: 0, margen: 0, operaciones: 0 })
  }
  return salida
}

/* ---------- Agrupación por dimensión ---------- */

export type Metrica = 'margen' | 'ingresos' | 'operaciones' | 'slaPct'

export interface Grupo {
  nombre: string
  /** Valor de la métrica elegida (para ordenar y graficar) */
  valor: number
  operaciones: number
  ingresos: number
  costos: number
  margen: number
  margenPct: number | null
  slaPct: number | null
}

/** Agrupa por una dimensión y devuelve la métrica elegida, ordenada de mayor a menor. */
export function agrupar(ops: readonly Operacion[], dim: Dimension, metrica: Metrica): Grupo[] {
  const grupos = new Map<string, Operacion[]>()
  for (const o of ops) {
    const lista = grupos.get(o[dim])
    if (lista) lista.push(o)
    else grupos.set(o[dim], [o])
  }
  return [...grupos.entries()]
    .map(([nombre, lista]) => {
      const k = calcularKpis(lista)
      const valor =
        metrica === 'operaciones' ? k.operaciones : metrica === 'slaPct' ? (k.slaPct ?? 0) : k[metrica]
      return {
        nombre,
        valor,
        operaciones: k.operaciones,
        ingresos: k.ingresos,
        costos: k.costos,
        margen: k.margen,
        margenPct: k.margenPct,
        slaPct: k.slaPct,
      }
    })
    .sort((a, b) => b.valor - a.valor || a.nombre.localeCompare(b.nombre, 'es'))
}

/* ---------- Utilidades ---------- */

/** Valores únicos de una dimensión, ordenados (para llenar los filtros). */
export const valoresUnicos = (ops: readonly Operacion[], dim: Dimension) =>
  [...new Set(ops.map((o) => o[dim]))].sort((a, b) => a.localeCompare(b, 'es'))

export const rangoFechas = (ops: readonly Operacion[]) => {
  if (!ops.length) return { min: '', max: '' }
  let min = ops[0].fecha
  let max = ops[0].fecha
  for (const o of ops) {
    if (o.fecha < min) min = o.fecha
    if (o.fecha > max) max = o.fecha
  }
  return { min, max }
}
