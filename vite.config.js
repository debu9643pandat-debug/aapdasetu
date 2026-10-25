import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,      // The exact port GPT told you about (http://localhost:5173)
    open: true       // Automatically opens your default web browser on launch
  }
});
