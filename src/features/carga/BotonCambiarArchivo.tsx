import { useDashboardActions } from '@/application'

/** Botón del encabezado para reemplazar el archivo cargado. */
export function BotonCambiarArchivo() {
  const { cargar } = useDashboardActions()
  return (
    <label className="btn">
      Cargar otro archivo
      <input
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void cargar(f, f.name)
          e.target.value = ''
        }}
      />
    </label>
  )
}
