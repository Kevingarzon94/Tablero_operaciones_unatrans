import { useDashboard, useDashboardActions } from '@/application'
import { contarFiltrosActivos, type Filtros } from '@/domain'
import { SelectField } from '@/shared/ui'

export function BarraFiltros() {
  const { filtros, opciones, operaciones, filtradas } = useDashboard()
  const { actualizarFiltros, limpiarFiltros } = useDashboardActions()
  const set = (campo: keyof Filtros) => (valor: string) => actualizarFiltros({ [campo]: valor })
  const activos = contarFiltrosActivos(filtros)

  return (
    <section className="filters" aria-label="Filtros">
      <SelectField label="Zona" value={filtros.zona} opciones={opciones.zonas} onChange={set('zona')} />
      <SelectField
        label="Tipo de servicio"
        value={filtros.tipoServicio}
        opciones={opciones.tipos}
        onChange={set('tipoServicio')}
      />
      <SelectField label="Estado" value={filtros.estado} opciones={opciones.estados} onChange={set('estado')} />
      <SelectField label="Cliente" value={filtros.cliente} opciones={opciones.clientes} onChange={set('cliente')} />
      <label className="field">
        <span>Desde</span>
        <input
          type="date"
          value={filtros.desde}
          min={opciones.fechaMin}
          max={filtros.hasta || opciones.fechaMax}
          onChange={(e) => set('desde')(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Hasta</span>
        <input
          type="date"
          value={filtros.hasta}
          min={filtros.desde || opciones.fechaMin}
          max={opciones.fechaMax}
          onChange={(e) => set('hasta')(e.target.value)}
        />
      </label>
      <div className="filters-meta">
        <span className="count">
          <strong>{filtradas.length}</strong> de {operaciones.length} operaciones
        </span>
        <button type="button" className="btn btn-ghost" onClick={limpiarFiltros} disabled={!activos}>
          Limpiar filtros{activos ? ` (${activos})` : ''}
        </button>
      </div>
    </section>
  )
}
