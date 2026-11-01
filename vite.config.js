const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/url': 'http://localhost:8001',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
