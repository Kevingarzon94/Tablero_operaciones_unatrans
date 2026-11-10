import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDashboard } from '@/application'
import { serieMensual, type PuntoMensual } from '@/domain'
import { fmtCOP, fmtCOPCorto, fmtMes } from '@/shared/format'
import { Card, EmptyState } from '@/shared/ui'
import { COLOR_SERIE, DURACION_ANIMACION, EJE, GRID } from './estiloGraficos'

interface ItemTooltip {
  dataKey: string
  name: string
  value: number
  color: string
  payload: PuntoMensual
}

function TooltipMensual({ active, payload, label }: { active?: boolean; payload?: ItemTooltip[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tt">
      <p className="tt-title">{fmtMes(String(label))}</p>
      {payload.map((s) => (
        <p key={s.dataKey} className="tt-row">
          <i style={{ background: s.color }} />
          <span>{s.name}</span>
          <b>{fmtCOP(s.value)}</b>
        </p>
      ))}
      <p className="tt-foot">{payload[0].payload.operaciones} operaciones</p>
    </div>
  )
}

const SERIES = [
  { key: 'ingresos', nombre: 'Ingresos', color: COLOR_SERIE.ingresos },
  { key: 'costos', nombre: 'Costos', color: COLOR_SERIE.costos },
  { key: 'margen', nombre: 'Margen', color: COLOR_SERIE.margen },
] as const

export function GraficoTendencia() {
  const { filtradas } = useDashboard()
  const data = useMemo(() => serieMensual(filtradas), [filtradas])

  return (
    <Card titulo="Ingresos, costos y margen por mes" subtitulo="Suma mensual en pesos colombianos" className="chart-card chart-wide">
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="mes" tickFormatter={fmtMes} tick={EJE} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={16} />
            <YAxis tickFormatter={fmtCOPCorto} tick={EJE} tickLine={false} axisLine={false} width={76} />
            <ReferenceLine y={0} stroke="var(--text-muted)" strokeOpacity={0.5} />
            <Tooltip content={<TooltipMensual />} cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '3 3' }} />
            <Legend itemSorter={null} verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ fontSize: 13, paddingBottom: 8 }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                name={s.nombre}
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
                animationDuration={DURACION_ANIMACION}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
