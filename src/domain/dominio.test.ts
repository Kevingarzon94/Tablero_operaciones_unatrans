import { describe, expect, it } from 'vitest'
import { crearOperacion as op } from '@/test/fabricas'
import { agrupar, aplicarFiltros, calcularKpis, FILTROS_VACIOS, rangoFechas, serieMensual, valoresUnicos } from '.'

describe('calcularKpis', () => {
  it('suma ingresos, costos y calcula el margen y su porcentaje', () => {
    const k = calcularKpis([op({ ingresos: 1000, costos: 600 }), op({ ingresos: 500, costos: 700 })])
    expect(k.operaciones).toBe(2)
    expect(k.ingresos).toBe(1500)
    expect(k.costos).toBe(1300)
    expect(k.margen).toBe(200)
    expect(k.margenPct).toBeCloseTo(200 / 1500)
  })

  it('calcula el SLA solo sobre operaciones ejecutadas (excluye canceladas)', () => {
    const k = calcularKpis([
      op({ estado: 'Completado', cumpleSla: true }),
      op({ estado: 'Con novedad', cumpleSla: false }),
      op({ estado: 'Cancelado', cumpleSla: false }),
    ])
    expect(k.baseSla).toBe(2)
    expect(k.cumplenSla).toBe(1)
    expect(k.slaPct).toBe(0.5)
  })

  it('cuenta las operaciones por estado y promedia la calificación', () => {
    const k = calcularKpis([op({ calificacion: 5 }), op({ calificacion: 3, estado: 'Cancelado' })])
    expect(k.porEstado).toEqual({ Completado: 1, Cancelado: 1 })
    expect(k.calificacionProm).toBe(4)
  })

  it('devuelve null en los porcentajes cuando no hay datos (no divide por cero)', () => {
    const k = calcularKpis([])
    expect(k.operaciones).toBe(0)
    expect(k.margenPct).toBeNull()
    expect(k.slaPct).toBeNull()
    expect(k.calificacionProm).toBeNull()
  })
})

describe('aplicarFiltros', () => {
  const datos = [
    op({ zona: 'Bogotá', estado: 'Completado', fecha: '2025-01-10' }),
    op({ zona: 'Antioquia', estado: 'Cancelado', fecha: '2025-02-10' }),
    op({ zona: 'Bogotá', estado: 'Cancelado', fecha: '2025-03-10' }),
  ]

  it('sin filtros devuelve todo', () => {
    expect(aplicarFiltros(datos, FILTROS_VACIOS)).toHaveLength(3)
  })

  it('combina filtros con Y lógico', () => {
    expect(aplicarFiltros(datos, { ...FILTROS_VACIOS, zona: 'Bogotá', estado: 'Cancelado' })).toHaveLength(1)
  })

  it('el rango de fechas es inclusivo en ambos extremos', () => {
    const r = aplicarFiltros(datos, { ...FILTROS_VACIOS, desde: '2025-02-10', hasta: '2025-03-10' })
    expect(r.map((o) => o.fecha)).toEqual(['2025-02-10', '2025-03-10'])
  })
})

describe('serieMensual', () => {
  it('agrupa por mes y rellena con ceros los meses sin operaciones', () => {
    const s = serieMensual([
      op({ fecha: '2025-11-03', ingresos: 100, costos: 40 }),
      op({ fecha: '2025-11-20', ingresos: 50, costos: 10 }),
      op({ fecha: '2026-01-05', ingresos: 70, costos: 20 }),
    ])
    expect(s.map((p) => p.mes)).toEqual(['2025-11', '2025-12', '2026-01'])
    expect(s[0]).toMatchObject({ ingresos: 150, costos: 50, margen: 100, operaciones: 2 })
    expect(s[1]).toMatchObject({ ingresos: 0, operaciones: 0 })
  })

  it('devuelve un arreglo vacío sin datos', () => {
    expect(serieMensual([])).toEqual([])
  })
})

describe('agrupar', () => {
  it('agrupa por dimensión y ordena de mayor a menor según la métrica', () => {
    const g = agrupar(
      [op({ zona: 'A', ingresos: 100, costos: 90 }), op({ zona: 'B', ingresos: 100, costos: 10 }), op({ zona: 'A', ingresos: 100, costos: 90 })],
      'zona',
      'margen',
    )
    expect(g.map((x) => [x.nombre, x.valor])).toEqual([
      ['B', 90],
      ['A', 20],
    ])
    expect(g[1].operaciones).toBe(2)
  })

  it('soporta márgenes negativos', () => {
    const [g] = agrupar([op({ zona: 'X', ingresos: 100, costos: 300 })], 'zona', 'margen')
    expect(g.valor).toBe(-200)
  })
})

describe('utilidades', () => {
  it('valoresUnicos ordena alfabéticamente en español', () => {
    expect(valoresUnicos([op({ zona: 'Valle' }), op({ zona: 'Antioquia' }), op({ zona: 'Valle' })], 'zona')).toEqual([
      'Antioquia',
      'Valle',
    ])
  })

  it('rangoFechas encuentra la mínima y la máxima', () => {
    expect(rangoFechas([op({ fecha: '2025-05-01' }), op({ fecha: '2025-01-01' }), op({ fecha: '2025-03-01' })])).toEqual({
      min: '2025-01-01',
      max: '2025-05-01',
    })
  })
})
