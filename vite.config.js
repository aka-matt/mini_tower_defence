import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'MiniTowerDefense',
      fileName: 'mini-tower-defense',
      formats: ['es']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  server: {
    open: true
  }
});
