import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './api.js';
import './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[Express API] ${req.method} ${req.path} - Origin: ${req.headers.origin || req.ip}`);
  }
  next();
});

// Montar endpoints de la API bajo el prefijo /api
app.use('/api', apiRouter);

// Servir la compilación estática de producción de React (dist) si existe
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Healthcheck de verificación rápida
app.get('/health', (req, res) => {
  res.json({ status: 'ok', engine: 'SQLite Local WAL', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  AutoCRM PRO MVP 3 - Servidor de Producción Activo`);
  console.log(`=======================================================`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Red LAN: http://0.0.0.0:${PORT}`);
  console.log(`  Motor:   SQLite WAL (crm_local.db)`);
  console.log(`=======================================================`);
});
