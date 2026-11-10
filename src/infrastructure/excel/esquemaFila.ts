import { z } from 'zod'
import type { Operacion } from '@/domain'
import { ESCALA_CALIFICACION } from '@/domain'
import { aBooleano, aFechaISO, aNumero, aTexto } from './conversores'

/**
 * Contrato del archivo: encabezado de Excel → campo del dominio.
 * Si mañana el archivo cambia un nombre de columna, solo se toca este mapa.
 */
export const COLUMNAS = {
  id: 'ID_Operacion',
  fecha: 'Fecha',
  zona: 'Zona',
  ruta: 'Ruta',
  tipoServicio: 'Tipo_Servicio',
  cliente: 'Cliente_Anonimizado',
  vehiculo: 'Vehiculo_Codigo',
  kilometros: 'Kilometros',
  horasPlaneadas: 'Horas_Planeadas',
  horasReales: 'Horas_Reales',
  estado: 'Estado',
  cumpleSla: 'Cumplimiento_SLA',
  ingresos: 'Ingresos_COP',
  costos: 'Costos_COP',
  margen: 'Margen_COP',
  calificacion: 'Calificacion_Servicio_1a5',
} as const satisfies Record<keyof Operacion, string>

export const COLUMNAS_REQUERIDAS = Object.values(COLUMNAS)

/* Tipos de celda reutilizables: primero convierten (preprocess) y luego validan. */
const texto = z.preprocess(aTexto, z.string())
const textoObligatorio = z.preprocess(aTexto, z.string().min(1, 'está vacío'))
const numero = z.preprocess(aNumero, z.number({ error: 'no es un número válido' }))
const noNegativo = z.preprocess(
  aNumero,
  z.number({ error: 'no es un número válido' }).nonnegative('no puede ser negativo'),
)
const fecha = z.preprocess(aFechaISO, z.string({ error: 'no es una fecha válida' }))
const siNo = z.preprocess(aBooleano, z.boolean({ error: 'debe ser Sí o No' }))
const conDefecto = (porDefecto: string) => texto.transform((s) => s || porDefecto)

/** Esquema de una fila del Excel, ya con los nombres de campo del dominio. */
export const esquemaFila = z.object({
  id: textoObligatorio,
  fecha,
  zona: conDefecto('Sin zona'),
  ruta: conDefecto('Sin ruta'),
  tipoServicio: conDefecto('Sin tipo'),
  cliente: conDefecto('Sin cliente'),
  vehiculo: texto,
  kilometros: noNegativo,
  horasPlaneadas: noNegativo,
  horasReales: noNegativo,
  estado: conDefecto('Sin estado'),
  cumpleSla: siNo,
  ingresos: noNegativo,
  costos: noNegativo,
  // El margen del archivo se lee solo para auditar; el dominio usa ingresos − costos.
  margen: numero.optional().catch(undefined),
  calificacion: z.preprocess(
    aNumero,
    z
      .number({ error: 'no es un número válido' })
      .min(ESCALA_CALIFICACION.min, `debe estar entre ${ESCALA_CALIFICACION.min} y ${ESCALA_CALIFICACION.max}`)
      .max(ESCALA_CALIFICACION.max, `debe estar entre ${ESCALA_CALIFICACION.min} y ${ESCALA_CALIFICACION.max}`),
  ),
})

export type FilaValidada = z.infer<typeof esquemaFila>
