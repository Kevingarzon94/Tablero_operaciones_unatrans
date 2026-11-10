import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { ErrorCarga } from '@/application/puertos'
import { aBooleano, aFechaISO, aNumero } from './conversores'
import { COLUMNAS_REQUERIDAS } from './esquemaFila'
import { ExcelOperacionesRepository } from './ExcelOperacionesRepository'

describe('conversores', () => {
  it('convierte números de serie de Excel a fecha ISO sin desfase de zona horaria', () => {
    expect(aFechaISO(45663)).toBe('2025-01-06') // primera fila del archivo de la prueba
    expect(aFechaISO(46325)).toBe('2026-10-30') // última fila
  })

  it('acepta fechas en texto ISO y dd/mm/aaaa, y rechaza fechas imposibles', () => {
    expect(aFechaISO('2025-03-14')).toBe('2025-03-14')
    expect(aFechaISO('14/03/2025')).toBe('2025-03-14')
    expect(aFechaISO('31/02/2025')).toBeNull()
    expect(aFechaISO('ayer')).toBeNull()
  })

  it.each([
    [1500, 1500],
    ['1.234.567', 1234567],
    ['$ 1,234,567', 1234567],
    ['1.234,5', 1234.5],
    ['12,5', 12.5],
    ['496.778', 496778],
    ['2.2', 2.2],
    ['1,234.5', 1234.5],
    ['-107241', -107241],
    ['', null],
    [null, null],
    ['abc', null],
  ])('aNumero(%j) → %j', (entrada, esperado) => {
    expect(aNumero(entrada)).toBe(esperado)
  })

  it.each([
    ['Sí', true],
    ['si', true],
    ['SI', true],
    ['No', false],
    [true, true],
    ['quizás', null],
  ])('aBooleano(%j) → %j', (entrada, esperado) => {
    expect(aBooleano(entrada)).toBe(esperado)
  })
})

/** Fila válida con los encabezados exactos del Excel. */
const filaExcel = (datos: Record<string, unknown> = {}) => ({
  ID_Operacion: 'OP-0001',
  Fecha: 45663,
  Zona: 'Bogotá',
  Ruta: 'Bogotá–Ibagué',
  Tipo_Servicio: 'Distribución urbana',
  Cliente_Anonimizado: 'Cliente B',
  Vehiculo_Codigo: 'VEH-024',
  Kilometros: 60,
  Horas_Planeadas: 1.6,
  Horas_Reales: 2.2,
  Estado: 'Con novedad',
  Cumplimiento_SLA: 'No',
  Ingresos_COP: 496778,
  Costos_COP: 251386,
  Margen_COP: 245392,
  Calificacion_Servicio_1a5: 3,
  ...datos,
})

describe('ExcelOperacionesRepository.procesar', () => {
  const repo = new ExcelOperacionesRepository()

  it('mapea una fila válida a una Operacion del dominio', () => {
    const { operaciones, advertencias } = repo.procesar('Datos', [filaExcel()])
    expect(advertencias).toEqual([])
    expect(operaciones[0]).toEqual({
      id: 'OP-0001',
      fecha: '2025-01-06',
      zona: 'Bogotá',
      ruta: 'Bogotá–Ibagué',
      tipoServicio: 'Distribución urbana',
      cliente: 'Cliente B',
      vehiculo: 'VEH-024',
      kilometros: 60,
      horasPlaneadas: 1.6,
      horasReales: 2.2,
      estado: 'Con novedad',
      cumpleSla: false,
      ingresos: 496778,
      costos: 251386,
      margen: 245392,
      calificacion: 3,
    })
  })

  it('falla con COLUMNAS_FALTANTES si el archivo no tiene la estructura esperada', () => {
    expect(() => repo.procesar('Hoja1', [{ ID_Operacion: 'X', Fecha: 1 }])).toThrowError(
      expect.objectContaining({ codigo: 'COLUMNAS_FALTANTES' }),
    )
  })

  it('descarta filas inválidas e informa la fila y la columna con el problema', () => {
    const r = repo.procesar('Datos', [
      filaExcel(),
      filaExcel({ ID_Operacion: 'OP-0002', Ingresos_COP: 'mucho' }),
      filaExcel({ ID_Operacion: 'OP-0003', Fecha: 'ayer' }),
    ])
    expect(r.operaciones).toHaveLength(1)
    expect(r.advertencias[0]).toContain('2 fila(s) descartada(s)')
    expect(r.advertencias[0]).toContain('fila 3: Ingresos_COP no es un número válido')
    expect(r.advertencias[0]).toContain('fila 4: Fecha no es una fecha válida')
  })

  it('rechaza calificaciones fuera de la escala 1 a 5', () => {
    const r = repo.procesar('Datos', [filaExcel(), filaExcel({ ID_Operacion: 'OP-0002', Calificacion_Servicio_1a5: 9 })])
    expect(r.operaciones).toHaveLength(1)
    expect(r.advertencias[0]).toContain('Calificacion_Servicio_1a5 debe estar entre 1 y 5')
  })

  it('conserva solo la primera aparición de un ID duplicado', () => {
    const r = repo.procesar('Datos', [filaExcel(), filaExcel({ Ingresos_COP: 1 })])
    expect(r.operaciones).toHaveLength(1)
    expect(r.operaciones[0].ingresos).toBe(496778)
    expect(r.advertencias.join()).toContain('duplicado')
  })

  it('recalcula el margen cuando el del archivo no cuadra y lo advierte', () => {
    const r = repo.procesar('Datos', [filaExcel({ Margen_COP: 999 })])
    expect(r.operaciones[0].margen).toBe(496778 - 251386)
    expect(r.advertencias.join()).toContain('Margen_COP distinto')
  })

  it('ignora filas totalmente vacías y acepta números escritos como texto', () => {
    const vacia = Object.fromEntries(COLUMNAS_REQUERIDAS.map((c) => [c, null]))
    const r = repo.procesar('Datos', [filaExcel({ Ingresos_COP: '496.778' }), vacia])
    expect(r.operaciones).toHaveLength(1)
    expect(r.operaciones[0].ingresos).toBe(496778)
    expect(r.advertencias).toEqual([])
  })

  it('falla con SIN_REGISTROS_VALIDOS si ninguna fila sirve', () => {
    expect(() => repo.procesar('Datos', [filaExcel({ ID_Operacion: '' })])).toThrowError(ErrorCarga)
  })
})

describe('ExcelOperacionesRepository.cargar (archivo .xlsx)', () => {
  const repo = new ExcelOperacionesRepository()
  const aBuffer = (wb: XLSX.WorkBook) => XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

  it('busca la hoja "Datos" aunque no sea la primera', async () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Léeme']]), 'Leer_primero')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([filaExcel()]), 'Datos')
    const r = await repo.cargar(aBuffer(wb))
    expect(r.origen).toBe('Datos')
    expect(r.operaciones).toHaveLength(1)
  })

  it('falla con HOJA_NO_ENCONTRADA si ninguna hoja tiene los datos', async () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['otra cosa']]), 'Hoja1')
    await expect(repo.cargar(aBuffer(wb))).rejects.toMatchObject({ codigo: 'HOJA_NO_ENCONTRADA' })
  })

  it('rechaza archivos que no son Excel', async () => {
    await expect(repo.cargar(new File(['hola'], 'datos.csv'))).rejects.toMatchObject({ codigo: 'FORMATO_NO_SOPORTADO' })
  })
})

describe('Integración con el archivo real de la prueba', () => {
  const ruta = fileURLToPath(new URL('../../assets/Datos_Sinteticos_Prueba_Tecnica_Unatrans.xlsx', import.meta.url))
  const buffer = () => {
    const b = readFileSync(ruta)
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
  }

  it('carga las 160 operaciones sin advertencias y con los totales validados contra pandas', async () => {
    const { calcularKpis } = await import('@/domain')
    const r = await new ExcelOperacionesRepository().cargar(buffer())
    expect(r.operaciones).toHaveLength(160)
    expect(r.advertencias).toEqual([])

    const k = calcularKpis(r.operaciones)
    expect(k.ingresos).toBe(134_350_665)
    expect(k.costos).toBe(104_646_676)
    expect(k.margen).toBe(29_703_989)
    expect(k.porEstado).toEqual({ Completado: 108, 'Con novedad': 32, Cancelado: 20 })
    expect(k.cumplenSla).toBe(89)
    expect(k.baseSla).toBe(140)
    expect(k.calificacionProm).toBeCloseTo(3.825)
    expect(r.operaciones[0].fecha).toBe('2025-01-06')
    expect(r.operaciones.at(-1)!.fecha).toBe('2026-10-30')
  })
})
