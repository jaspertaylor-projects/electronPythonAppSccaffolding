// Frontend/vite.config.js
// Purpose: Configuration for Vite bundler, including React plugin and global shims for Plotly.
// Key Internal Depends On: (none)
// Key Internal Exported To: (none)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix for Plotly in Vite: force usage of the browser distribution to avoid Node.js polyfill issues
      'plotly.js': 'plotly.js/dist/plotly.js',
    },
  },
  define: {
    // Polyfill global for libraries like Plotly that expect it in the browser environment
    global: 'window',
  },
  optimizeDeps: {
    include: ['plotly.js', 'react-plotly.js'],
  },
})
