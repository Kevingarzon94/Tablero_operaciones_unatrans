import type { Operacion } from '@/domain'
import type { Columna } from './columnas'

/** Lógica pura de la tabla (sin React): se prueba de forma aislada. */

export interface Orden {
  key: keyof Operacion
  asc: boolean
}

const CAMPOS_BUSQUEDA = ['id', 'ruta', 'vehiculo', 'cliente', 'zona', 'tipoServicio', 'estado'] as const

export function buscar(ops: readonly Operacion[], texto: string): readonly Operacion[] {
  const q = texto.trim().toLowerCase()
  if (!q) return ops
  return ops.filter((o) => CAMPOS_BUSQUEDA.some((c) => o[c].toLowerCase().includes(q)))
}

export function ordenar(ops: readonly Operacion[], { key, asc }: Orden): Operacion[] {
  return [...ops].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es', { numeric: true })
    return asc ? cmp : -cmp
  })
}

export function paginar<T>(filas: readonly T[], pagina: number, porPagina: number) {
  const totalPaginas = Math.max(1, Math.ceil(filas.length / porPagina))
  const actual = Math.min(Math.max(0, pagina), totalPaginas - 1)
  return {
    filas: filas.slice(actual * porPagina, (actual + 1) * porPagina),
    pagina: actual,
    totalPaginas,
  }
}

/** CSV con separador ";" y BOM, para que Excel en español lo abra con tildes y columnas correctas. */
export function generarCsv(filas: readonly Operacion[], columnas: readonly Columna[]): string {
  const escapar = (v: string | number) => {
    const s = String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const encabezado = columnas.map((c) => escapar(c.label)).join(';')
  const cuerpo = filas.map((o) => columnas.map((c) => escapar(c.csv ? c.csv(o) : String(o[c.key]))).join(';'))
  return '﻿' + [encabezado, ...cuerpo].join('\n')
}

export function descargarTexto(contenido: string, nombre: string, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}
