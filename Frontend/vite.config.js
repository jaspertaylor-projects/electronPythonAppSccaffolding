// Frontend/vite.config.js
// Purpose: Configuration for Vite bundler, including React plugin.
// Key Internal Depends On: (none)
// Key Internal Exported To: (none)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
