/**
 * Vite Configuration
 *
 * Vite is a build tool and dev server that:
 * - Provides instant HMR (Hot Module Replacement) for faster development
 * - Uses native ES modules during development (no bundling)
 * - Bundles for production with Rollup
 *
 * Configuration:
 * - React plugin for JSX transformation
 * - Path aliases (@/* for src/*, @shared/* for shared package)
 * - Dev server proxy for API calls
 * - Build optimizations
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      // Proxy API calls to backend during development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging in production
    minify: 'terser',
  },
});
