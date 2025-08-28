import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      'firebase/app': 'firebase/app',
      'firebase/firestore': 'firebase/firestore',
      'firebase/auth': 'firebase/auth',
      'firebase/storage': 'firebase/storage',
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html')
      },
      external: ['firebase']
    }
  }
});
