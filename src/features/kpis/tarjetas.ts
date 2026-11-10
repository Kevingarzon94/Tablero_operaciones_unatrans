import type { Kpis } from '@/domain'
import { fmtCOP, fmtCOPCorto, fmtNum, fmtPct } from '@/shared/format'

export interface Tarjeta {
  label: string
  valor: string
  /** Valor exacto al pasar el mouse */
  titulo?: string
  detalle: string
  negativo?: boolean
}

/** Construye el contenido de las tarjetas (función pura, separada del render). */
export function construirTarjetas(k: Kpis): Tarjeta[] {
  const estados = Object.entries(k.porEstado)
    .sort((a, b) => b[1] - a[1])
    .map(([e, n]) => `${e}: ${n}`)
    .join(' · ')

  return [
    { label: 'Operaciones', valor: fmtNum(k.operaciones), detalle: estados || 'Sin registros' },
    {
      label: 'Ingresos',
      valor: fmtCOPCorto(k.ingresos),
      titulo: fmtCOP(k.ingresos),
      detalle: `${fmtNum(k.kilometros)} km recorridos`,
    },
    {
      label: 'Costos',
      valor: fmtCOPCorto(k.costos),
      titulo: fmtCOP(k.costos),
      detalle: k.ingresos ? `${fmtPct(k.costos / k.ingresos)} de los ingresos` : '—',
    },
    {
      label: 'Margen',
      valor: fmtCOPCorto(k.margen),
      titulo: fmtCOP(k.margen),
      detalle: `Margen ${fmtPct(k.margenPct)} sobre ingresos`,
      negativo: k.margen < 0,
    },
    {
      label: 'Cumplimiento SLA',
      valor: fmtPct(k.slaPct),
      detalle: `${k.cumplenSla} de ${k.baseSla} ejecutadas (sin canceladas)`,
    },
    {
      label: 'Calificación promedio',
      valor: k.calificacionProm == null ? '—' : `${fmtNum(k.calificacionProm)} / 5`,
      detalle: 'Escala de 1 a 5',
    },
  ]
}
