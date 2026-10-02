import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multiple HTML entry points so the hub page builds alongside the main demo.
// Add a new line here whenever a new top-level page (e.g. part1.html,
// asra.html) is added to the project.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        hub: resolve(__dirname, 'hub.html')
      }
    }
  }
});
