import { describe, expect, it } from 'vitest'
import { FILTROS_VACIOS } from '@/domain'
import { crearOperacion } from '@/test/fabricas'
import { dashboardReducer, estadoInicial, type DashboardState } from './dashboardReducer'
import type { ResultadoCarga } from './puertos'

const datos: ResultadoCarga = { operaciones: [crearOperacion()], origen: 'Datos', filasLeidas: 1, advertencias: [] }
const listo: DashboardState = dashboardReducer(estadoInicial, { type: 'carga/exitosa', datos, nombreArchivo: 'a.xlsx' })

describe('dashboardReducer', () => {
  it('sigue el flujo vacio → cargando → listo', () => {
    const cargando = dashboardReducer(estadoInicial, { type: 'carga/iniciada' })
    expect(cargando.estado).toBe('cargando')
    expect(listo.estado).toBe('listo')
    expect(listo.datos).toBe(datos)
  })

  it('pasa a error si falla la primera carga', () => {
    const s = dashboardReducer(estadoInicial, { type: 'carga/fallida', error: 'mal' })
    expect(s).toMatchObject({ estado: 'error', error: 'mal' })
  })

  it('conserva los datos anteriores si falla la carga de un segundo archivo', () => {
    const s = dashboardReducer(listo, { type: 'carga/fallida', error: 'mal' })
    expect(s).toMatchObject({ estado: 'listo', datos, error: 'mal' })
  })

  it('un archivo nuevo reinicia los filtros', () => {
    const conFiltro = dashboardReducer(listo, { type: 'filtros/actualizados', filtros: { zona: 'Bogotá' } })
    const recargado = dashboardReducer(conFiltro, { type: 'carga/exitosa', datos, nombreArchivo: 'b.xlsx' })
    expect(recargado.filtros).toEqual(FILTROS_VACIOS)
  })

  it('alternar un filtro lo activa y, con el mismo valor, lo desactiva', () => {
    const on = dashboardReducer(listo, { type: 'filtros/alternado', campo: 'estado', valor: 'Cancelado' })
    expect(on.filtros.estado).toBe('Cancelado')
    const off = dashboardReducer(on, { type: 'filtros/alternado', campo: 'estado', valor: 'Cancelado' })
    expect(off.filtros.estado).toBe('')
  })

  it('actualizar filtros es parcial y limpiar los reinicia todos', () => {
    let s = dashboardReducer(listo, { type: 'filtros/actualizados', filtros: { zona: 'Bogotá' } })
    s = dashboardReducer(s, { type: 'filtros/actualizados', filtros: { cliente: 'Cliente A' } })
    expect(s.filtros).toMatchObject({ zona: 'Bogotá', cliente: 'Cliente A' })
    expect(dashboardReducer(s, { type: 'filtros/limpiados' }).filtros).toEqual(FILTROS_VACIOS)
  })
})
