/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base './' permite publicar el build en cualquier carpeta o subruta (Vercel, Netlify, GitHub Pages).
// `npm run build:single` genera un único index.html autocontenido (para compartir la demo como un archivo).
export default defineConfig(({ mode }) => ({
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  assetsInclude: ['**/*.xlsx'], // permite importar el Excel de ejemplo como asset
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build:
    mode === 'single'
      ? { outDir: 'dist-single' }
      : {
          chunkSizeWarningLimit: 600,
          // Librerías pesadas en chunks separados: el navegador las cachea aunque cambie el código de la app.
          rolldownOptions: {
            output: {
              advancedChunks: {
                groups: [
                  { name: 'xlsx', test: /node_modules[\\/]xlsx/ },
                  { name: 'charts', test: /node_modules[\\/](recharts|d3-|victory-vendor)/ },
                  { name: 'vendor', test: /node_modules/ },
                ],
              },
            },
          },
        },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
