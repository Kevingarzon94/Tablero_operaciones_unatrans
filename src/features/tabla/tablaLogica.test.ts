import { describe, expect, it } from 'vitest'
import { crearOperacion as op } from '@/test/fabricas'
import type { Columna } from './columnas'
import { buscar, generarCsv, ordenar, paginar } from './tablaLogica'

const datos = [
  op({ id: 'OP-0002', ruta: 'Cali–Palmira', ingresos: 300 }),
  op({ id: 'OP-0010', ruta: 'Bogotá–Tunja', ingresos: 100 }),
  op({ id: 'OP-0001', ruta: 'Medellín–Rionegro', vehiculo: 'VEH-024', ingresos: 200 }),
]

describe('tabla', () => {
  it('busca sin distinguir mayúsculas en varios campos', () => {
    expect(buscar(datos, 'cali').map((o) => o.id)).toEqual(['OP-0002'])
    expect(buscar(datos, 'veh-024').map((o) => o.id)).toEqual(['OP-0001'])
    expect(buscar(datos, '  ')).toHaveLength(3)
  })

  it('ordena números numéricamente y textos de forma natural, sin mutar el arreglo', () => {
    expect(ordenar(datos, { key: 'ingresos', asc: true }).map((o) => o.ingresos)).toEqual([100, 200, 300])
    expect(ordenar(datos, { key: 'id', asc: false }).map((o) => o.id)).toEqual(['OP-0010', 'OP-0002', 'OP-0001'])
    expect(datos[0].id).toBe('OP-0002')
  })

  it('pagina y corrige páginas fuera de rango', () => {
    const lista = Array.from({ length: 23 }, (_, i) => i)
    expect(paginar(lista, 2, 10)).toEqual({ filas: [20, 21, 22], pagina: 2, totalPaginas: 3 })
    expect(paginar(lista, 99, 10).pagina).toBe(2)
    expect(paginar([], 0, 10)).toEqual({ filas: [], pagina: 0, totalPaginas: 1 })
  })

  it('genera CSV con ";" , BOM y escapa valores con separadores o comillas', () => {
    const cols: Columna[] = [
      { key: 'id', label: 'ID' },
      { key: 'ruta', label: 'Ruta' },
      { key: 'cumpleSla', label: 'SLA', csv: (o) => (o.cumpleSla ? 'Sí' : 'No') },
    ]
    const csv = generarCsv([op({ id: 'A', ruta: 'X;"Y"', cumpleSla: true })], cols)
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).split('\n')).toEqual(['ID;Ruta;SLA', 'A;"X;""Y""";Sí'])
  })
})
