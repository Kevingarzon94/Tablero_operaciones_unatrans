import type { ReactNode } from 'react'
import { ESTADOS, type Operacion } from '@/domain'
import { fmtCOP, fmtFecha, fmtNum } from '@/shared/format'

export interface Columna {
  key: keyof Operacion
  label: string
  numerica?: boolean
  /** Cómo se ve en pantalla */
  render?: (o: Operacion) => ReactNode
  /** Cómo se exporta a CSV (por defecto el valor crudo) */
  csv?: (o: Operacion) => string | number
}

const ICONO_ESTADO: Record<string, string> = {
  [ESTADOS.completado]: '✓',
  [ESTADOS.conNovedad]: '!',
  [ESTADOS.cancelado]: '✕',
}
const CLASE_ESTADO: Record<string, string> = {
  [ESTADOS.completado]: 'ok',
  [ESTADOS.conNovedad]: 'warn',
  [ESTADOS.cancelado]: 'bad',
}

/** Definición declarativa de columnas: agregar o quitar una columna es editar este arreglo. */
export const COLUMNAS: Columna[] = [
  { key: 'id', label: 'ID' },
  { key: 'fecha', label: 'Fecha', render: (o) => fmtFecha(o.fecha) },
  { key: 'zona', label: 'Zona' },
  { key: 'ruta', label: 'Ruta' },
  { key: 'tipoServicio', label: 'Servicio' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'vehiculo', label: 'Vehículo' },
  { key: 'kilometros', label: 'Km', numerica: true, render: (o) => fmtNum(o.kilometros) },
  { key: 'horasPlaneadas', label: 'H. plan', numerica: true, render: (o) => fmtNum(o.horasPlaneadas) },
  { key: 'horasReales', label: 'H. real', numerica: true, render: (o) => fmtNum(o.horasReales) },
  {
    key: 'estado',
    label: 'Estado',
    render: (o) => (
      <span className={`badge ${CLASE_ESTADO[o.estado] ?? ''}`}>
        <span aria-hidden="true">{ICONO_ESTADO[o.estado] ?? '•'}</span> {o.estado}
      </span>
    ),
  },
  { key: 'cumpleSla', label: 'SLA', render: (o) => (o.cumpleSla ? 'Sí' : 'No'), csv: (o) => (o.cumpleSla ? 'Sí' : 'No') },
  { key: 'ingresos', label: 'Ingresos', numerica: true, render: (o) => fmtCOP(o.ingresos) },
  { key: 'costos', label: 'Costos', numerica: true, render: (o) => fmtCOP(o.costos) },
  {
    key: 'margen',
    label: 'Margen',
    numerica: true,
    render: (o) => <span className={o.margen < 0 ? 'neg' : undefined}>{fmtCOP(o.margen)}</span>,
  },
  { key: 'calificacion', label: 'Calif.', numerica: true },
]
