import { useRef, useState } from 'react'
import { useDashboard, useDashboardActions } from '@/application'
import { Alert } from '@/shared/ui'
import { NOMBRE_ARCHIVO_EJEMPLO, obtenerArchivoEjemplo } from './archivoEjemplo'

/** Pantalla inicial: arrastrar y soltar o seleccionar el .xlsx. */
export function CargaArchivo() {
  const { estado, error } = useDashboard()
  const { cargar } = useDashboardActions()
  const input = useRef<HTMLInputElement>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const cargando = estado === 'cargando'

  const recibir = (archivos: FileList | null) => {
    const f = archivos?.[0]
    if (f) void cargar(f, f.name)
  }

  return (
    <section className="upload-wrap">
      <div
        className={`dropzone${arrastrando ? ' is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastrando(false)
          recibir(e.dataTransfer.files)
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2>{cargando ? 'Leyendo archivo…' : 'Carga el archivo Excel de operaciones'}</h2>
        <p>
          Arrastra aquí el <strong>.xlsx</strong> o haz clic para seleccionarlo. Se lee la hoja <code>Datos</code>{' '}
          directamente en tu navegador; nada se envía a un servidor.
        </p>
        <input
          ref={input}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={(e) => {
            recibir(e.target.files)
            e.target.value = '' // permite volver a cargar el mismo archivo
          }}
        />
      </div>
      {error && (
        <Alert tipo="error" titulo="No se pudo cargar el archivo.">
          {error}
        </Alert>
      )}
      <button
        type="button"
        className="btn btn-link"
        disabled={cargando}
        onClick={() => void cargar(obtenerArchivoEjemplo(), NOMBRE_ARCHIVO_EJEMPLO)}
      >
        ¿Solo quieres verlo? Usar el archivo de la prueba
      </button>
    </section>
  )
}
