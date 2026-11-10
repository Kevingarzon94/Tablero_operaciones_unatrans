import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Prueba de arquitectura: verifica que las dependencias entre capas apunten "hacia adentro".
 * Si alguien importa React o SheetJS desde el dominio, esta prueba falla en CI.
 */

const SRC = fileURLToPath(new URL('.', import.meta.url))

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return archivos(p)
    return /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : []
  })
}

const importsDe = (archivo: string) =>
  [...readFileSync(archivo, 'utf8').matchAll(/^import\s.*?from\s+['"]([^'"]+)['"]/gms)].map((m) => m[1])

const capa = (archivo: string) => relative(SRC, archivo).split(sep)[0]

/** Qué puede importar cada capa (además de sí misma). */
const PERMITIDO: Record<string, { capas: string[]; librerias: RegExp }> = {
  domain: { capas: [], librerias: /^$/ }, // TypeScript puro: sin librerías
  application: { capas: ['domain'], librerias: /^react$/ },
  infrastructure: { capas: ['domain', 'application'], librerias: /^(xlsx|zod)$/ },
  features: { capas: ['domain', 'application', 'shared', 'assets'], librerias: /^(react|recharts)$/ },
  shared: { capas: [], librerias: /^react$/ },
}

describe('reglas de dependencia entre capas', () => {
  for (const [nombre, regla] of Object.entries(PERMITIDO)) {
    it(`${nombre} solo depende de: ${[...regla.capas, regla.librerias.source].filter((x) => x && x !== '^$').join(', ') || 'nada externo'}`, () => {
      const violaciones = archivos(join(SRC, nombre)).flatMap((archivo) =>
        importsDe(archivo)
          .filter((imp) => {
            if (imp.startsWith('.')) return false // imports internos de la misma capa
            if (imp.startsWith('@/')) {
              const destino = imp.slice(2).split('/')[0]
              return destino !== nombre && !regla.capas.includes(destino)
            }
            return !regla.librerias.test(imp)
          })
          .map((imp) => `${relative(SRC, archivo)} → ${imp}`),
      )
      expect(violaciones).toEqual([])
    })
  }

  it('solo un archivo importa SheetJS (adaptador aislado)', () => {
    const usanXlsx = archivos(SRC).filter((a) => importsDe(a).includes('xlsx')).map((a) => relative(SRC, a))
    expect(usanXlsx).toEqual([join('infrastructure', 'excel', 'lectorExcel.ts')])
  })

  it('features no se importan entre sí (se comunican a través del store)', () => {
    const cruzados = archivos(join(SRC, 'features')).flatMap((archivo) => {
      const propia = relative(join(SRC, 'features'), archivo).split(sep)[0]
      return importsDe(archivo)
        .filter((imp) => imp.startsWith('@/features/') && imp.split('/')[2] !== propia)
        .map((imp) => `${relative(SRC, archivo)} → ${imp}`)
    })
    expect(cruzados).toEqual([])
  })

  it('capa() identifica la carpeta de primer nivel', () => {
    expect(capa(join(SRC, 'domain', 'kpis.ts'))).toBe('domain')
  })
})
