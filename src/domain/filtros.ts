import type { Operacion } from './operacion'

export interface Filtros {
  zona: string
  tipoServicio: string
  estado: string
  cliente: string
  /** ISO 'YYYY-MM-DD', inclusive */
  desde: string
  /** ISO 'YYYY-MM-DD', inclusive */
  hasta: string
}

export type FiltroCategorico = 'zona' | 'tipoServicio' | 'estado' | 'cliente'

export const FILTROS_VACIOS: Filtros = {
  zona: '',
  tipoServicio: '',
  estado: '',
  cliente: '',
  desde: '',
  hasta: '',
}

/** Un filtro vacío significa "todas". Las fechas ISO se comparan como texto. */
export function aplicarFiltros(ops: readonly Operacion[], f: Filtros): Operacion[] {
  return ops.filter(
    (o) =>
      (!f.zona || o.zona === f.zona) &&
      (!f.tipoServicio || o.tipoServicio === f.tipoServicio) &&
      (!f.estado || o.estado === f.estado) &&
      (!f.cliente || o.cliente === f.cliente) &&
      (!f.desde || o.fecha >= f.desde) &&
      (!f.hasta || o.fecha <= f.hasta),
  )
}

export const contarFiltrosActivos = (f: Filtros) => Object.values(f).filter(Boolean).length
