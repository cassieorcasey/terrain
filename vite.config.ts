import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base = nama repo, karena situsnya ada di cassieorcasey.github.io/terrain/
export default defineConfig({
  plugins: [react()],
  base: '/terrain/',
});
