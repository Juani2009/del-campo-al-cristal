import { defineConfig } from 'vite';
import path from 'node:path';
import { lltPlugin } from './server/plugin.js';

// Local (por defecto): un solo comando y un solo puerto para computadora, QR, celulares y Socket.IO.
// Web (`--mode web`): sitio estático sin servidor de votaciones (portada, recorrido 2D, LLT individual y final).
export default defineConfig(({ mode }) => {
  const web = mode === 'web';
  const pages = { main: 'index.html', clarificador: 'clarificador.html', final: 'final.html', ...(web ? {} : { votar: 'votar.html', control: 'control.html' }) };
  return {
    base: web ? './' : '/',
    plugins: web ? [] : [lltPlugin()],
    server: { host: '0.0.0.0', port: 5173, strictPort: true },
    preview: { host: '0.0.0.0', port: web ? 4174 : 4173, strictPort: true },
    build: {
      target: 'es2022', chunkSizeWarningLimit: 1500, outDir: web ? 'dist-web' : 'dist',
      rollupOptions: { input: Object.fromEntries(Object.entries(pages).map(([k, f]) => [k, path.resolve(f)])) },
    },
  };
});
