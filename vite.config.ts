import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Chunking strategy pour éviter le chunk 3.8 MB monolithique
    rollupOptions: {
      // @sentry/react est optionnel (pas installé par défaut).
      // Il sera résolu à runtime si et seulement si VITE_SENTRY_DSN est fourni.
      // Sans cette ligne, Rollup plante à cause du dynamic import dans sentry.ts.
      external: (id) => id === '@sentry/react',
      output: {
        manualChunks(id) {
          // React core — chargé en premier, très stable (cache fort)
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/@tanstack/')) {
            return 'react-vendor';
          }
          // Supabase — rarement modifié, gros, mis en cache séparément
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
          // Stack PDF/PPTX — chargé uniquement sur /reports
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/jspdf-autotable') ||
              id.includes('node_modules/pptxgenjs') ||
              id.includes('node_modules/file-saver')) {
            return 'pdf-stack';
          }
          // Recharts + framer-motion — graphiques
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/framer-motion')) {
            return 'charts';
          }
          // html2canvas — lourd, utilisé ponctuellement
          if (id.includes('node_modules/html2canvas')) {
            return 'html2canvas';
          }
          // Lucide icons — très volumineux, doit être tree-shaken max
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
        },
      },
    },
    // Alerte à 1.5 MB (down from 500 KB par défaut)
    chunkSizeWarningLimit: 1500,
  },
});
