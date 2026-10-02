import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multiple HTML entry points — index.html is now the hub/homepage.
// Add a new line here whenever a new top-level page (e.g. asra.html) is
// added to the project.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'index.html'),
        demo1: resolve(__dirname, 'demo-1.html'),
        demo2: resolve(__dirname, 'demo-2.html'),
        asra: resolve(__dirname, 'asra.html'),
        asraMap: resolve(__dirname, 'asra-map.html')
      }
    }
  }
});
