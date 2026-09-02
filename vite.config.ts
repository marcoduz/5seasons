import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Nova importação

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Configuração do Alias
    },
  },
});