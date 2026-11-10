import { useMemo } from 'react'
import { useDashboard, useDashboardActions } from '@/application'
import { agrupar } from '@/domain'
import { fmtCOPCorto, fmtPct } from '@/shared/format'
import { Card, EmptyState } from '@/shared/ui'
import { COLOR_ESTADO, COLOR_ESTADO_DEFECTO } from './estiloGraficos'

/** Barras HTML simples: pocas categorías, con etiqueta, conteo y % siempre visibles. */
export function GraficoEstados() {
  const { filtradas } = useDashboard()
  const { alternarFiltro } = useDashboardActions()
  // Reutiliza la misma agregación del dominio que el gráfico comparativo.
  const data = useMemo(() => agrupar(filtradas, 'estado', 'operaciones'), [filtradas])
  const total = filtradas.length

  return (
    <Card titulo="Operaciones por estado" subtitulo="Haz clic en un estado para filtrar" className="chart-card">
      {total === 0 ? (
        <EmptyState />
      ) : (
        <ul className="status-list">
          {data.map((g) => {
            const color = COLOR_ESTADO[g.nombre] ?? COLOR_ESTADO_DEFECTO
            return (
              <li key={g.nombre}>
                <button type="button" onClick={() => alternarFiltro('estado', g.nombre)} className="status-row">
                  <span className="status-label">
                    <i className="dot" style={{ background: color }} />
                    {g.nombre}
                  </span>
                  <span className="status-bar">
                    <span style={{ width: `${(g.operaciones / total) * 100}%`, background: color }} />
                  </span>
                  <span className="status-num">
                    <b>{g.operaciones}</b> · {fmtPct(g.operaciones / total)}
                  </span>
                  <span className="status-sub">
                    SLA {fmtPct(g.slaPct ?? 0)} · margen {fmtCOPCorto(g.margen)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
