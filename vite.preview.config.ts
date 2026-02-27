import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/preview/',
  server: {
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      path: '/preview/',
    },
  },
})
