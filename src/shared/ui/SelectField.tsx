interface Props {
  label: string
  value: string
  opciones: readonly string[]
  onChange: (valor: string) => void
  /** Texto de la opción vacía (sin filtro) */
  textoTodas?: string
}

export function SelectField({ label, value, opciones, onChange, textoTodas = 'Todas' }: Props) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{textoTodas}</option>
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
