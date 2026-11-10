# Tablero de operaciones

Prueba técnica de **Desarrollador Full-Stack & Especialista en IA** (Unión Andina de Transportes).

Es una aplicación web que carga el Excel de operaciones sintéticas y muestra un resumen visual: indicadores, gráficos, filtros y una tabla con los registros. Todo se procesa en el navegador, sin backend.

## Cómo ejecutarla

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm test           # 63 pruebas unitarias (Vitest)
npm run typecheck  # verificación de tipos
npm run lint       # linter (oxlint)
npm run build      # build de producción en dist/
npm run preview    # sirve el build en http://localhost:4173
```

Al abrir la app, arrastra el `.xlsx` a la zona de carga o haz clic para seleccionarlo. También hay un botón **"Usar el archivo de la prueba"** que carga la copia embebida en el bundle (`src/assets/`) (útil en la demo si falla el selector de archivos).

**Publicarla:** como `dist/` es estático (y `base: './'`), sirve en Vercel, Netlify o GitHub Pages sin configuración extra. En Vercel basta con importar el repositorio: detecta Vite solo.

## Qué incluye

| Requisito de la prueba | Implementación |
|---|---|
| Carga y lectura del Excel | Arrastrar y soltar o seleccionar archivo. Lectura con SheetJS, validación de hoja y columnas, mensajes de error claros |
| 3 indicadores (mínimo) | 6 KPIs: operaciones, ingresos, costos, margen (y % de margen), cumplimiento de SLA y calificación promedio |
| Al menos un gráfico | 3 gráficos: tendencia mensual (ingresos, costos, margen), comparativo por zona, servicio, cliente o ruta con métrica seleccionable, y distribución por estado |
| Tabla de registros | Las 16 columnas, búsqueda, orden por cualquier columna, paginación, margen negativo resaltado y exportación del resultado filtrado a CSV |
| Al menos un filtro | Zona, tipo de servicio, estado, cliente y rango de fechas. Además, clic en las barras o en los estados para filtrar |
| Interfaz clara | Diseño responsive (escritorio y móvil), modo oscuro automático, tooltips con el detalle |

## Arquitectura

Arquitectura **por capas, inspirada en Clean Architecture y organizada por features**. El detalle completo, con diagramas, decisiones (ADR) y ruta de escalamiento, está en **[ARQUITECTURA.md](./ARQUITECTURA.md)**.

```
src/
├── domain/           Reglas de negocio puras: Operacion, KPIs, filtros, política de SLA
├── application/      Estado (reducer + context) e interfaz OperacionesRepository
├── infrastructure/   Lectura del Excel (SheetJS) y validación por fila (zod)
├── features/         carga · filtros · kpis · graficos · tabla
├── shared/           UI reutilizable y formatos es-CO
└── app/              Raíz de composición: inyecta el repositorio y arma el layout
```

**Flujo de datos:** Excel → `ExcelOperacionesRepository` → `Operacion[]` → `aplicarFiltros()` → `calcularKpis()` → KPIs, gráficos y tabla. Hay **una sola fuente de verdad** (el arreglo filtrado), así que todos los componentes siempre muestran el mismo subconjunto.

Puntos clave para escalar:
- **La fuente de datos está detrás de una interfaz.** Pasar de Excel a una API es crear otro repositorio y cambiar una línea en `App.tsx`.
- **El dominio no depende de React ni de Excel.** Se puede reutilizar tal cual en un backend Node.js.
- **Las reglas de dependencia se prueban automáticamente** (`src/arquitectura.test.ts`) y el CI corre en cada push.

## Decisiones principales

1. **Sin backend.** La prueba no lo pide y el archivo es pequeño (160 filas). Leerlo en el navegador simplifica el despliegue, y los datos no salen del equipo del usuario.
2. **React + TypeScript + Vite.** Es mi stack habitual. Los tipos evitan errores al mapear las columnas del Excel, y Vite da un build estático listo para publicar.
3. **SheetJS (`xlsx`)** para leer el Excel y **Recharts** para los gráficos: son librerías maduras y declarativas.
4. **Fechas como texto ISO (`YYYY-MM-DD`).** Excel guarda las fechas como número de serie. Convertirlas con `new Date()` puede correrlas un día por la zona horaria del navegador. Por eso se convierten con aritmética UTC directamente a texto (`conversores.ts`), lo que además permite comparar rangos como cadenas.
5. **El margen se recalcula** como `Ingresos − Costos`. En este archivo coincide en las 160 filas, pero si otro archivo trae diferencias, la app usa el valor recalculado y lo informa en el panel de advertencias.
6. **SLA sobre operaciones ejecutadas.** Las 20 operaciones canceladas tienen `Cumplimiento_SLA = No`. Incluirlas castiga el indicador por algo que no es un tema de tiempos: daría 55,6% en vez de 63,6%. Por eso el KPI se calcula sobre las no canceladas y la tarjeta lo dice explícitamente ("89 de 140 ejecutadas").
7. **Las canceladas sí cuentan en ingresos y costos.** El archivo les registra valores, y ocultarlas escondería que en conjunto generan pérdida (−$1,1 M de margen). Se pueden excluir con el filtro de estado.
8. **Validación declarativa con zod.** Busca la hoja `Datos` (o la primera con `ID_Operacion`), verifica las 16 columnas y valida cada fila contra un esquema. Acepta números en formato colombiano ("496.778"), descarta filas inválidas e IDs duplicados, e informa la fila y la columna con el problema sin bloquear la carga.
9. **Ejes que empiezan en cero** en las barras, para no exagerar diferencias. Colores validados para daltonismo, y los estados llevan ícono además del color.

## Validación de los cálculos

Los KPIs se compararon contra un cálculo independiente en Python (pandas) sobre el mismo archivo. Además, estos totales quedaron fijados en una prueba de integración (`excel.test.ts`), así que cualquier cambio que los altere rompe el CI:

| Indicador | Dashboard | pandas |
|---|---|---|
| Operaciones | 160 | 160 |
| Ingresos | $134.350.665 | 134.350.665 |
| Costos | $104.646.676 | 104.646.676 |
| Margen | $29.703.989 (22,1%) | 29.703.989 |
| SLA (ejecutadas) | 63,6% (89/140) | 89/140 |
| Calificación promedio | 3,8 | 3,825 |
| Bogotá + Completado | 19 ops, margen $4.144.530, SLA 89,5% | igual |

## Hallazgos en los datos

- Valle del Cauca es la zona con mayor margen ($6,5 M); Costa Caribe, la de menor ($3,6 M).
- Las operaciones "Con novedad" tienen 0% de SLA, y las completadas, 82,4%.
- Hay 27 operaciones con margen negativo, todas resaltadas en rojo en la tabla.
- Bogotá–Tunja (25%) y Bucaramanga–Tunja (28,6%) son las rutas con peor cumplimiento de SLA.

## Uso de Vibe Coding

**Herramienta:** Claude Code (asistente de IA agéntico que lee archivos, escribe código, ejecuta comandos y prueba en un navegador).

**Cómo la usé:**

1. **Análisis antes de programar.** Le pasé el PDF y el Excel, y le pedí analizar los requisitos y perfilar los datos con pandas (nulos, duplicados, consistencia del margen, relación Estado–SLA). De ahí salieron las decisiones 5 a 7.
2. **Especificación en lenguaje natural.** Definí el stack, la estructura de carpetas y los componentes. La IA generó el proyecto separando la lógica pura (`lib/`) de la interfaz (`components/`).
3. **Verificación automatizada.** La IA levantó el build, cargó el Excel en un navegador headless (Playwright), leyó los KPIs y los comparó con pandas. También probó los filtros, el clic en gráficos, la búsqueda, un Excel con columnas faltantes y la vista móvil en modo oscuro.
4. **Iteraciones a partir de las capturas** (ajustes reales del proceso):
   - El eje del gráfico de barras arrancaba en $3,4 M, lo que exageraba las diferencias entre zonas. Se forzó a empezar en 0.
   - La leyenda salía ordenada alfabéticamente (Costos, Ingresos…). Se dejó en el orden lógico.
   - Las etiquetas de rutas largas se cortaban. Se amplió el eje.
   - El linter señaló dependencias de hooks y un `setState` dentro de `useEffect`. Se corrigieron con `useMemo` y el patrón de "estado previo".
5. **Refactor de arquitectura.** Con la versión funcional lista, reorganicé el proyecto en capas: dominio puro, repositorio con zod, store con reducer y features. Agregué 63 pruebas y CI. Las pruebas encontraron un caso real: "496.778" se leía como 496,778 en vez de la convención colombiana de miles, y se corrigió.
6. **Revisión humana.** Revisé y entiendo cada módulo. Las decisiones de negocio (cómo tratar canceladas y SLA) fueron mías, con base en los datos.

## Limitaciones y siguientes pasos

- El bundle está dividido en chunks (app, vendor, xlsx, gráficos) para que el navegador los cachee por separado.
- Posibles mejoras: filtros de selección múltiple, filtros en la URL, pruebas de componentes con Testing Library y un comparativo contra el periodo anterior. La ruta completa está en [ARQUITECTURA.md](./ARQUITECTURA.md#ruta-de-escalamiento).
