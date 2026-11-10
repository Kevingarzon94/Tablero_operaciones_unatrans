import { useDashboard } from '@/application'
import { Card } from '@/shared/ui'
import { COLUMNAS } from './columnas'
import { descargarTexto, generarCsv } from './tablaLogica'
import { useTablaOperaciones } from './useTablaOperaciones'

const OPCIONES_POR_PAGINA = [10, 25, 50, 100]

export function TablaOperaciones() {
  const { filtradas } = useDashboard()
  const t = useTablaOperaciones(filtradas)

  return (
    <Card
      titulo="Registros"
      subtitulo={`${t.resultado.length} operaciones · clic en un encabezado para ordenar · margen negativo en rojo`}
      acciones={
        <>
          <input
            type="search"
            placeholder="Buscar ID, ruta, vehículo…"
            value={t.busqueda}
            onChange={(e) => t.setBusqueda(e.target.value)}
            aria-label="Buscar en la tabla"
          />
          <button
            type="button"
            className="btn"
            disabled={!t.resultado.length}
            onClick={() => descargarTexto(generarCsv(t.resultado, COLUMNAS), 'operaciones_filtradas.csv')}
          >
            Exportar CSV
          </button>
        </>
      }
    >
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {COLUMNAS.map((c) => (
                <th
                  key={c.key}
                  className={c.numerica ? 'num' : undefined}
                  aria-sort={t.orden.key === c.key ? (t.orden.asc ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" onClick={() => t.ordenarPor(c.key)}>
                    {c.label}
                    <span className="sort">{t.orden.key === c.key ? (t.orden.asc ? '▲' : '▼') : ''}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.visibles.map((o) => (
              <tr key={o.id}>
                {COLUMNAS.map((c) => (
                  <td key={c.key} className={c.numerica ? 'num' : undefined}>
                    {c.render ? c.render(o) : String(o[c.key])}
                  </td>
                ))}
              </tr>
            ))}
            {!t.visibles.length && (
              <tr>
                <td colSpan={COLUMNAS.length} className="empty">
                  No hay registros que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="pager">
        <label>
          Filas por página{' '}
          <select value={t.porPagina} onChange={(e) => t.setPorPagina(Number(e.target.value))}>
            {OPCIONES_POR_PAGINA.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <span>
          Página {t.pagina + 1} de {t.totalPaginas}
        </span>
        <div>
          <button type="button" className="btn" onClick={t.anterior} disabled={t.pagina === 0}>
            Anterior
          </button>
          <button type="button" className="btn" onClick={t.siguiente} disabled={t.pagina >= t.totalPaginas - 1}>
            Siguiente
          </button>
        </div>
      </footer>
    </Card>
  )
}
