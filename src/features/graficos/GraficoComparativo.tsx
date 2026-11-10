import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDashboard, useDashboardActions } from '@/application'
import { agrupar, type Grupo, type Metrica } from '@/domain'
import { fmtCOP, fmtCOPCorto, fmtNum, fmtPct } from '@/shared/format'
import { Card, EmptyState } from '@/shared/ui'
import { COLOR_SERIE, DURACION_ANIMACION, EJE, GRID } from './estiloGraficos'

/** Dimensiones disponibles. `filtrable` indica si el clic en la barra puede filtrar el tablero. */
const DIMENSIONES = [
  { v: 'zona', label: 'Zona', filtrable: true },
  { v: 'tipoServicio', label: 'Tipo de servicio', filtrable: true },
  { v: 'cliente', label: 'Cliente', filtrable: true },
  { v: 'ruta', label: 'Ruta', filtrable: false },
] as const
type DimensionComparativo = (typeof DIMENSIONES)[number]['v']

const METRICAS: { v: Metrica; label: string }[] = [
  { v: 'margen', label: 'Margen' },
  { v: 'ingresos', label: 'Ingresos' },
  { v: 'operaciones', label: 'Operaciones' },
  { v: 'slaPct', label: '% SLA' },
]

const fmtMetrica = (m: Metrica, v: number, corto = false) =>
  m === 'operaciones' ? fmtNum(v) : m === 'slaPct' ? fmtPct(v) : corto ? fmtCOPCorto(v) : fmtCOP(v)

function TooltipGrupo({ active, payload }: { active?: boolean; payload?: { payload: Grupo }[] }) {
  if (!active || !payload?.length) return null
  const g = payload[0].payload
  return (
    <div className="tt">
      <p className="tt-title">{g.nombre}</p>
      <p className="tt-row"><span>Operaciones</span><b>{g.operaciones}</b></p>
      <p className="tt-row"><span>Ingresos</span><b>{fmtCOP(g.ingresos)}</b></p>
      <p className="tt-row"><span>Costos</span><b>{fmtCOP(g.costos)}</b></p>
      <p className="tt-row"><span>Margen</span><b>{fmtCOP(g.margen)} ({fmtPct(g.margenPct)})</b></p>
      <p className="tt-row"><span>SLA</span><b>{fmtPct(g.slaPct)}</b></p>
    </div>
  )
}

export function GraficoComparativo() {
  const { filtradas } = useDashboard()
  const { alternarFiltro } = useDashboardActions()
  const [dim, setDim] = useState<DimensionComparativo>('zona')
  const [metrica, setMetrica] = useState<Metrica>('margen')

  const data = useMemo(() => agrupar(filtradas, dim, metrica), [filtradas, dim, metrica])
  const config = DIMENSIONES.find((d) => d.v === dim)!
  const etiquetaMetrica = METRICAS.find((m) => m.v === metrica)!.label
  const alto = Math.max(180, data.length * 34 + 30)

  const alClicBarra = (g: Grupo) => {
    if (config.filtrable && dim !== 'ruta') alternarFiltro(dim, g.nombre)
  }

  return (
    <Card
      titulo={`${etiquetaMetrica} por ${config.label.toLowerCase()}`}
      subtitulo={config.filtrable ? 'Haz clic en una barra para filtrar el tablero' : 'Ordenado de mayor a menor'}
      className="chart-card"
      acciones={
        <>
          <select aria-label="Agrupar por" value={dim} onChange={(e) => setDim(e.target.value as DimensionComparativo)}>
            {DIMENSIONES.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}
          </select>
          <select aria-label="Métrica" value={metrica} onChange={(e) => setMetrica(e.target.value as Metrica)}>
            {METRICAS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
        </>
      }
    >
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={alto}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 72, left: 0, bottom: 0 }} barCategoryGap={6}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            {/* El eje siempre incluye el 0 para no exagerar las diferencias entre barras */}
            <XAxis
              type="number"
              tickFormatter={(v) => fmtMetrica(metrica, v, true)}
              tick={EJE}
              tickLine={false}
              axisLine={false}
              domain={metrica === 'slaPct' ? [0, 1] : [(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]}
            />
            <YAxis type="category" dataKey="nombre" tick={EJE} tickLine={false} axisLine={false} width={dim === 'ruta' ? 200 : 128} interval={0} />
            <ReferenceLine x={0} stroke="var(--text-muted)" strokeOpacity={0.6} />
            <Tooltip content={<TooltipGrupo />} cursor={{ fill: 'var(--hover)' }} />
            <Bar
              dataKey="valor"
              radius={4}
              maxBarSize={22}
              animationDuration={DURACION_ANIMACION}
              cursor={config.filtrable ? 'pointer' : 'default'}
              onClick={(d) => alClicBarra(d.payload as Grupo)}
            >
              {data.map((g) => (
                <Cell key={g.nombre} fill={g.valor < 0 ? COLOR_SERIE.negativo : COLOR_SERIE.positivo} />
              ))}
              <LabelList
                dataKey="valor"
                position="right"
                formatter={(v) => fmtMetrica(metrica, Number(v), true)}
                style={{ fontSize: 12, fill: 'var(--text-secondary)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
