import { createContext, useContext } from 'react'
import type { FiltroCategorico, Filtros, Kpis, Operacion } from '@/domain'
import type { DashboardState } from './dashboardReducer'

export interface OpcionesFiltro {
  zonas: string[]
  tipos: string[]
  estados: string[]
  clientes: string[]
  fechaMin: string
  fechaMax: string
}

export interface DashboardContextValue extends DashboardState {
  /** Todas las operaciones cargadas */
  operaciones: Operacion[]
  /** Única fuente de verdad para KPIs, gráficos y tabla */
  filtradas: Operacion[]
  kpis: Kpis
  opciones: OpcionesFiltro
}

export interface DashboardActions {
  cargar: (fuente: unknown, nombreArchivo: string) => Promise<void>
  actualizarFiltros: (filtros: Partial<Filtros>) => void
  alternarFiltro: (campo: FiltroCategorico, valor: string) => void
  limpiarFiltros: () => void
}

/* Dos contextos separados: los componentes que solo despachan acciones no se re-renderizan cuando cambian los datos. */
export const StateContext = createContext<DashboardContextValue | null>(null)
export const ActionsContext = createContext<DashboardActions | null>(null)

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useDashboard debe usarse dentro de <DashboardProvider>')
  return ctx
}

export function useDashboardActions(): DashboardActions {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useDashboardActions debe usarse dentro de <DashboardProvider>')
  return ctx
}
