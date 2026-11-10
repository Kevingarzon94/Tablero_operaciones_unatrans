import { DashboardProvider, useDashboard } from '@/application'
import { CargaArchivo } from '@/features/carga'
import { ExcelOperacionesRepository } from '@/infrastructure/excel/ExcelOperacionesRepository'
import { Encabezado } from './Encabezado'
import { Tablero } from './Tablero'

/**
 * Raíz de composición: el único lugar que decide QUÉ implementación de datos se usa.
 * Para leer de una API bastaría con cambiar esta línea por `new ApiOperacionesRepository(url)`.
 */
const repositorio = new ExcelOperacionesRepository()

function Contenido() {
  const { datos } = useDashboard()
  return (
    <div className="app">
      <Encabezado />
      <main>{datos ? <Tablero /> : <CargaArchivo />}</main>
      <footer className="foot">
        Los datos se procesan solo en el navegador. Registros ficticios suministrados para la prueba técnica.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <DashboardProvider repositorio={repositorio}>
      <Contenido />
    </DashboardProvider>
  )
}
