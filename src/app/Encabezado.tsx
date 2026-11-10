import { useDashboard } from '@/application'
import { BotonCambiarArchivo } from '@/features/carga'
import { fmtFecha } from '@/shared/format'

export function Encabezado() {
  const { datos, nombreArchivo, operaciones, opciones } = useDashboard()

  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path
              d="M3 17h2m14 0h2M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM9 17h6M3 13V7a1 1 0 0 1 1-1h10v11M14 9h4l3 4v4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h1>Tablero de operaciones</h1>
          <p>Mini dashboard · datos sintéticos de transporte</p>
        </div>
      </div>
      {datos && (
        <div className="file-info">
          <span title={nombreArchivo}>
            <b>{nombreArchivo}</b> · hoja “{datos.origen}” · {operaciones.length} registros ·{' '}
            {fmtFecha(opciones.fechaMin)} – {fmtFecha(opciones.fechaMax)}
          </span>
          <BotonCambiarArchivo />
        </div>
      )}
    </header>
  )
}
