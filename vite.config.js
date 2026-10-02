import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multiple HTML entry points — index.html is now the hub/homepage.
// Add a new line here whenever a new top-level page (e.g. demo-1.html,
// asra.html) is added to the project.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'index.html'),
        demo2: resolve(__dirname, 'demo-2.html')
      }
    }
  }
});
