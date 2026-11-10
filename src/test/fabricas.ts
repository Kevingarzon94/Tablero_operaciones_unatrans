import type { Operacion } from '@/domain'

let secuencia = 0

/** Crea una operación válida con valores por defecto; cada prueba sobrescribe solo lo que le importa. */
export function crearOperacion(datos: Partial<Operacion> = {}): Operacion {
  secuencia++
  const ingresos = datos.ingresos ?? 1_000_000
  const costos = datos.costos ?? 600_000
  return {
    id: `OP-${String(secuencia).padStart(4, '0')}`,
    fecha: '2025-01-15',
    zona: 'Bogotá',
    ruta: 'Bogotá–Tunja',
    tipoServicio: 'Carga general',
    cliente: 'Cliente A',
    vehiculo: 'VEH-001',
    kilometros: 100,
    horasPlaneadas: 3,
    horasReales: 3,
    estado: 'Completado',
    cumpleSla: true,
    calificacion: 4,
    ...datos,
    ingresos,
    costos,
    margen: ingresos - costos,
  }
}
