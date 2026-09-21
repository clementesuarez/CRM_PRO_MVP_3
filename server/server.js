import express from 'express';
import cors from 'cors';
import { router as apiRouter } from './api.js';
import './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Montar endpoints bajo el prefijo /api
app.use('/api', apiRouter);

// Healthcheck de verificación rápida
app.get('/health', (req, res) => {
    res.json({ status: 'ok', engine: 'SQLite Local WAL', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`[Express] Servidor local CRM activo en http://localhost:${PORT}`);
});
