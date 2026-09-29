import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pre-bundle every Firebase entry in one pass. Otherwise Vite discovers
  // some of them mid-session, re-optimises, and the page ends up with two
  // copies of @firebase/app ("Component auth has not been registered yet").
  optimizeDeps: {
    include: [
      'firebase/app', 'firebase/auth', 'firebase/firestore',
      'firebase/functions', 'firebase/analytics', 'firebase/storage',
    ],
  },
  server: {
    port: 3001,
    strictPort: true,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions', 'firebase/analytics', 'firebase/storage'],
          'ui-vendor': ['framer-motion', 'recharts', 'lucide-react'],
        },
      },
    },
  },
})
