import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// base must match the GitHub Pages subpath (repo name) or built assets 404.
export default defineConfig({
  base: '/PathFindingVisualizer/',
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
