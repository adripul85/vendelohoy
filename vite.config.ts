import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'https://de-oportunidades.vercel.app',
            changeOrigin: true,
            secure: true,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2020',
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('firebase')) return 'vendor-firebase';
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
                if (id.includes('framer-motion')) return 'vendor-framer-motion';
                if (id.includes('@tinymce') || id.includes('tinymce')) return 'vendor-tinymce';
                if (id.includes('@google/genai')) return 'vendor-ai';
                if (id.includes('react-icons')) return 'vendor-icons';
                if (id.includes('date-fns') || id.includes('papaparse') || id.includes('lenis')) return 'vendor-utils';
                
                // Excluimos el fallback gigante a 'vendor-libs' para que Vite (Rollup)
                // optimice los chunks restantes basándose en el grafo de dependencias
                // y no tengamos un chunk excesivamente grande.
              }
            }
          }
        }
      }
    };
});
