import { useCallback, useMemo, useReducer, type ReactNode } from 'react'
import { aplicarFiltros, calcularKpis, rangoFechas, valoresUnicos, type Operacion } from '@/domain'
import { dashboardReducer, estadoInicial } from './dashboardReducer'
import {
  ActionsContext,
  StateContext,
  type DashboardActions,
  type DashboardContextValue,
  type OpcionesFiltro,
} from './contexto'
import type { OperacionesRepository } from './puertos'

const SIN_OPERACIONES: Operacion[] = []

interface Props {
  /** Inyección de dependencias: la fuente de datos llega desde afuera (Excel hoy, API mañana, mock en pruebas). */
  repositorio: OperacionesRepository
  children: ReactNode
}

export function DashboardProvider({ repositorio, children }: Props) {
  const [state, dispatch] = useReducer(dashboardReducer, estadoInicial)

  const cargar = useCallback(
    async (fuente: unknown, nombreArchivo: string) => {
      dispatch({ type: 'carga/iniciada' })
      try {
        const datos = await repositorio.cargar(fuente)
        dispatch({ type: 'carga/exitosa', datos, nombreArchivo })
      } catch (e) {
        dispatch({ type: 'carga/fallida', error: e instanceof Error ? e.message : 'Error desconocido al leer el archivo.' })
      }
    },
    [repositorio],
  )

  // Las acciones no cambian entre renders: los componentes que solo despachan no se re-renderizan.
  const actions = useMemo<DashboardActions>(
    () => ({
      cargar,
      actualizarFiltros: (filtros) => dispatch({ type: 'filtros/actualizados', filtros }),
      alternarFiltro: (campo, valor) => dispatch({ type: 'filtros/alternado', campo, valor }),
      limpiarFiltros: () => dispatch({ type: 'filtros/limpiados' }),
    }),
    [cargar],
  )

  // Datos derivados: se calculan una sola vez aquí y se comparten, en vez de recalcularlos en cada componente.
  const operaciones = state.datos?.operaciones ?? SIN_OPERACIONES
  const opciones = useMemo<OpcionesFiltro>(() => {
    const { min, max } = rangoFechas(operaciones)
    return {
      zonas: valoresUnicos(operaciones, 'zona'),
      tipos: valoresUnicos(operaciones, 'tipoServicio'),
      estados: valoresUnicos(operaciones, 'estado'),
      clientes: valoresUnicos(operaciones, 'cliente'),
      fechaMin: min,
      fechaMax: max,
    }
  }, [operaciones])
  const filtradas = useMemo(() => aplicarFiltros(operaciones, state.filtros), [operaciones, state.filtros])
  const kpis = useMemo(() => calcularKpis(filtradas), [filtradas])

  const value = useMemo<DashboardContextValue>(
    () => ({ ...state, operaciones, filtradas, kpis, opciones }),
    [state, operaciones, filtradas, kpis, opciones],
  )

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={value}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  )
}
