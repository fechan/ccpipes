import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ 
      find: "@server", 
      replacement: resolve(__dirname, '../server/src/') 
    }]
  }
})
