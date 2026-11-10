import { FILTROS_VACIOS, type FiltroCategorico, type Filtros } from '@/domain'
import type { ResultadoCarga } from './puertos'

/**
 * Estado del tablero como máquina de estados explícita:
 * vacio → cargando → listo | error. Un reducer puro hace que cada transición
 * sea predecible y se pueda probar sin React.
 */
export type EstadoCarga = 'vacio' | 'cargando' | 'listo' | 'error'

export interface DashboardState {
  estado: EstadoCarga
  datos: ResultadoCarga | null
  nombreArchivo: string
  error: string | null
  filtros: Filtros
}

export type DashboardAction =
  | { type: 'carga/iniciada' }
  | { type: 'carga/exitosa'; datos: ResultadoCarga; nombreArchivo: string }
  | { type: 'carga/fallida'; error: string }
  | { type: 'filtros/actualizados'; filtros: Partial<Filtros> }
  | { type: 'filtros/alternado'; campo: FiltroCategorico; valor: string }
  | { type: 'filtros/limpiados' }

export const estadoInicial: DashboardState = {
  estado: 'vacio',
  datos: null,
  nombreArchivo: '',
  error: null,
  filtros: FILTROS_VACIOS,
}

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'carga/iniciada':
      return { ...state, estado: 'cargando', error: null }
    case 'carga/exitosa':
      // Un archivo nuevo reinicia los filtros: sus valores podrían no existir en él.
      return {
        estado: 'listo',
        datos: action.datos,
        nombreArchivo: action.nombreArchivo,
        error: null,
        filtros: FILTROS_VACIOS,
      }
    case 'carga/fallida':
      // Si ya había datos, se conservan y el tablero sigue usable.
      return { ...state, estado: state.datos ? 'listo' : 'error', error: action.error }
    case 'filtros/actualizados':
      return { ...state, filtros: { ...state.filtros, ...action.filtros } }
    case 'filtros/alternado': {
      const actual = state.filtros[action.campo]
      return { ...state, filtros: { ...state.filtros, [action.campo]: actual === action.valor ? '' : action.valor } }
    }
    case 'filtros/limpiados':
      return { ...state, filtros: FILTROS_VACIOS }
  }
}
