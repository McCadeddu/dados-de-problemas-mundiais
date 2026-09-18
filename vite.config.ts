import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/dados-de-problemas-mundiais/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        fomeESede: path.resolve(__dirname, 'fome-e-sede/index.html'),
        genero: path.resolve(__dirname, 'genero/index.html'),
        pobreza: path.resolve(__dirname, 'pobreza/index.html'),
        clima: path.resolve(__dirname, 'clima/index.html'),
        migracao: path.resolve(__dirname, 'migracao/index.html'),
      },
      output: {
        manualChunks: {
          charts: ['recharts'],
          maps: ['d3-geo', 'd3-scale'],
        },
      },
    },
  },
})
