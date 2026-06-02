import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Limits warning size threshold
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Group vendor modules to enable efficient long-term browser caching and faster loading speeds
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group Framer Motion together (handles standard animations and spring transitions)
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion';
            }
            // Group Supabase libraries together (handles database services and WebSocket listeners)
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'vendor-supabase';
            }
            // Group SVG Lucide Icons
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            // React cores and others
            return 'vendor-core';
          }
        }
      }
    }
  }
});
