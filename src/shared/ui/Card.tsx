import type { ReactNode } from 'react'

interface Props {
  titulo: ReactNode
  subtitulo?: ReactNode
  /** Controles a la derecha del encabezado (selects, botones) */
  acciones?: ReactNode
  className?: string
  children: ReactNode
}

/** Contenedor estándar de las secciones del tablero. */
export function Card({ titulo, subtitulo, acciones, className = '', children }: Props) {
  return (
    <article className={`card ${className}`.trim()}>
      <header className="card-head">
        <div>
          <h2>{titulo}</h2>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        {acciones && <div className="seg-group">{acciones}</div>}
      </header>
      {children}
    </article>
  )
}
