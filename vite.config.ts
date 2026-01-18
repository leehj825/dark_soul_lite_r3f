import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force Vite to look directly in the libs folder
      'stickman-animator-r3f': path.resolve(__dirname, './libs/stickman-animator-r3f')
    }
  }
})