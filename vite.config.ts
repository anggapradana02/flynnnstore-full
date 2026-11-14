import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Tambahkan baris ini agar bisa diakses dari HP di jaringan yang sama
    port: 5173
  }
});