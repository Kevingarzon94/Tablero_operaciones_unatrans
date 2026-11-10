import { useDashboard } from '@/application'
import { construirTarjetas } from './tarjetas'

export function TarjetasKpi() {
  const { kpis } = useDashboard()
  return (
    <section className="kpis" aria-label="Indicadores principales">
      {construirTarjetas(kpis).map((t) => (
        <article key={t.label} className="kpi" title={t.titulo}>
          <h3>{t.label}</h3>
          <p className={`kpi-value${t.negativo ? ' is-neg' : ''}`}>{t.valor}</p>
          <p className="kpi-detail">{t.detalle}</p>
        </article>
      ))}
    </section>
  )
}
