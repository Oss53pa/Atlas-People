import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Respecte le port assigné par l'environnement (preview / CI).
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
