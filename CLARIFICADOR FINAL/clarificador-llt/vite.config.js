import { defineConfig } from 'vite';
import path from 'node:path';
import { lltPlugin } from './server/plugin.js';

// Un solo comando y un solo puerto para computadora, QR, celulares y Socket.IO.
export default defineConfig({
  base:'/',
  plugins:[lltPlugin()],
  server:{host:'0.0.0.0',port:5173,strictPort:true},
  preview:{host:'0.0.0.0',port:4173,strictPort:true},
  build:{target:'es2020',chunkSizeWarningLimit:1500,rollupOptions:{input:{main:path.resolve('index.html'),votar:path.resolve('votar.html'),control:path.resolve('control.html')}}}
});
