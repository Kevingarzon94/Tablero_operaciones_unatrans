import { useMemo, useState } from 'react'
import type { Operacion } from '@/domain'
import { buscar, ordenar, paginar, type Orden } from './tablaLogica'

/** Estado local de la tabla (búsqueda, orden, página). No vive en el store global porque solo le importa a la tabla. */
export function useTablaOperaciones(ops: readonly Operacion[]) {
  const [busqueda, setBusquedaState] = useState('')
  const [orden, setOrden] = useState<Orden>({ key: 'fecha', asc: false })
  const [pagina, setPagina] = useState(0)
  const [porPagina, setPorPaginaState] = useState(10)

  // Si cambian los filtros del tablero, volver a la primera página (patrón "estado previo" de React).
  const [opsPrevias, setOpsPrevias] = useState(ops)
  if (opsPrevias !== ops) {
    setOpsPrevias(ops)
    setPagina(0)
  }

  const resultado = useMemo(() => ordenar(buscar(ops, busqueda), orden), [ops, busqueda, orden])
  const pag = paginar(resultado, pagina, porPagina)

  return {
    resultado,
    visibles: pag.filas,
    pagina: pag.pagina,
    totalPaginas: pag.totalPaginas,
    busqueda,
    orden,
    porPagina,
    setBusqueda: (v: string) => {
      setBusquedaState(v)
      setPagina(0)
    },
    setPorPagina: (n: number) => {
      setPorPaginaState(n)
      setPagina(0)
    },
    ordenarPor: (key: keyof Operacion) => setOrden((o) => (o.key === key ? { key, asc: !o.asc } : { key, asc: true })),
    anterior: () => setPagina((p) => Math.max(0, p - 1)),
    siguiente: () => setPagina((p) => Math.min(pag.totalPaginas - 1, p + 1)),
  }
}
