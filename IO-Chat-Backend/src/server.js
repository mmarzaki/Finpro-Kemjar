import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { initDb } from './database/index.js';

dotenv.config();

initDb();

const app = express();

// Basic middleware
app.use(cors());
// VULNERABLE (DoS): batas ukuran body besar (dan tidak ada validasi tipe),
// memungkinkan pengiriman payload besar untuk menguras memori.
app.use(express.json({ limit: '50mb' }));

// VULNERABLE (DoS): rate limiting sengaja DINONAKTIFKAN.
// Selain itu, rate limiting berbasis jumlah request tidak melindungi dari
// request tunggal yang mahal (lihat /api/debug/*).
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
// app.use('/api/', apiLimiter);

// API routes — diekspor sebagai Express app supaya bisa dipakai Vercel serverless.
app.use('/api', routes);

// Vercel tidak mendukung koneksi WebSocket persisten.
// Socket.IO (dan Redis yang dipakainya) hanya dijalankan saat server lokal / non-Vercel.
if (process.env.VERCEL !== '1') {
  const httpServer = http.createServer(app);

  import('./sockets/index.js')
    .then(({ initializeSockets }) => {
      initializeSockets(httpServer);
      const PORT = process.env.PORT || 4000;
      httpServer.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
    })
    .catch((err) => console.error('Failed to initialize sockets:', err));
}

export default app;
