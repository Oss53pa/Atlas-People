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
    rollupOptions: {
      // @sentry/react est optionnel (pas installé par défaut).
      external: (id) => id === '@sentry/react',
      output: {
        manualChunks(id) {
          // ── Règle de sécurité ──────────────────────────────────────────
          // NE JAMAIS isoler recharts, framer-motion, lucide-react ni aucune
          // librairie qui appelle React.forwardRef / React.createContext dans
          // son module-level code. Si leur chunk charge avant react-vendor,
          // on obtient "Cannot read properties of undefined (reading 'forwardRef')".
          //
          // Seules les librairies SANS dépendance directe sur l'objet React
          // (Supabase, jspdf, pptxgenjs, file-saver, html2canvas) peuvent être
          // séparées en chunks indépendants.
          // ──────────────────────────────────────────────────────────────

          // React + routing + query — chunk stable, cache fort
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/@tanstack/')
          ) {
            return 'react-vendor';
          }

          // Supabase — aucune dépendance React, safe à isoler
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }

          // PDF/PPTX — aucune dépendance React, safe à isoler
          if (
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/jspdf-autotable') ||
            id.includes('node_modules/pptxgenjs') ||
            id.includes('node_modules/file-saver')
          ) {
            return 'pdf-stack';
          }

          // html2canvas — aucune dépendance React, safe à isoler
          if (id.includes('node_modules/html2canvas')) {
            return 'html2canvas';
          }

          // recharts, framer-motion, lucide-react → restent dans le chunk principal
          // pour garantir que React est déjà disponible quand ils s'initialisent.
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
