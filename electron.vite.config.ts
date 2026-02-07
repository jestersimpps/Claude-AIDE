import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'src/main/index.ts'
      }
    },
    resolve: {
      alias: {
        '@main': resolve('src/main')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'src/preload/index.ts'
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
