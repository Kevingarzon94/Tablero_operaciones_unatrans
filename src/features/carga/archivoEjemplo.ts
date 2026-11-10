// El Excel de la prueba va embebido en el bundle (base64) para la demo: no depende de red ni de servidor.
import ejemploDataUrl from '@/assets/Datos_Sinteticos_Prueba_Tecnica_Unatrans.xlsx?inline'

export const NOMBRE_ARCHIVO_EJEMPLO = 'Datos_Sinteticos_Prueba_Tecnica_Unatrans.xlsx'

/** Decodifica el data URL embebido a un ArrayBuffer listo para el repositorio. */
export function obtenerArchivoEjemplo(): ArrayBuffer {
  const base64 = ejemploDataUrl.slice(ejemploDataUrl.indexOf(',') + 1)
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer
}
