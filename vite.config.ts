import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { router as apiRouter } from './server/api.js';

function sqliteApiPlugin(): Plugin {
  return {
    name: 'sqlite-api-plugin',
    configureServer(server) {
      const app = express();
      app.use(cors());
      app.use(express.json({ limit: '50mb' }));
      app.use(express.urlencoded({ extended: true, limit: '50mb' }));
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    },
    configurePreviewServer(server) {
      const app = express();
      app.use(cors());
      app.use(express.json({ limit: '50mb' }));
      app.use(express.urlencoded({ extended: true, limit: '50mb' }));
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sqliteApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Expone el servidor en la Red Local (LAN) para usarlo en múltiples computadoras/celulares de la agencia
    port: 5173,
  },
});
