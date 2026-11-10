import { useDashboard } from '@/application'
import { BarraFiltros } from '@/features/filtros'
import { GraficoComparativo, GraficoEstados, GraficoTendencia } from '@/features/graficos'
import { TarjetasKpi } from '@/features/kpis'
import { TablaOperaciones } from '@/features/tabla'
import { Alert } from '@/shared/ui'

/** Vista principal una vez cargados los datos. Solo compone features; no tiene lógica. */
export function Tablero() {
  const { datos, error } = useDashboard()
  const advertencias = datos?.advertencias ?? []

  return (
    <>
      {error && (
        <Alert tipo="error" titulo="No se pudo cargar el nuevo archivo.">
          {error} Se siguen mostrando los datos anteriores.
        </Alert>
      )}
      {advertencias.length > 0 && (
        <details className="alert alert-warn">
          <summary>{advertencias.length} advertencia(s) de calidad de datos</summary>
          <ul>
            {advertencias.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      )}

      <BarraFiltros />
      <TarjetasKpi />

      <section className="charts">
        <GraficoTendencia />
        <GraficoComparativo />
        <GraficoEstados />
      </section>

      <TablaOperaciones />
    </>
  )
}
