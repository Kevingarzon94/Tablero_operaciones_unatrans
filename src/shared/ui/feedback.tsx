import type { ReactNode } from 'react'

export function EmptyState({ children = 'Sin datos para los filtros seleccionados.' }: { children?: ReactNode }) {
  return <p className="empty">{children}</p>
}

export function Alert({ tipo, titulo, children }: { tipo: 'error' | 'warn'; titulo?: string; children?: ReactNode }) {
  return (
    <div className={`alert alert-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {titulo && <strong>{titulo}</strong>} {children}
    </div>
  )
}
