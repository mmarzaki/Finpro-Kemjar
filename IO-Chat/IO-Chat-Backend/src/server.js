import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';

dotenv.config();

// Vercel menyetel VERCEL=1 / VERCEL_ENV. Pakai keduanya supaya deteksi aman.
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

// Catatan: skema tabel dibuat sekali lewat database_dump.sql di SQL Editor Neon.
// initDb() sengaja TIDAK dipanggil supaya tidak ada query background yang
// menyita koneksi pool saat cold start (menyebabkan 504 di serverless).

const app = express();

// CORS: izinkan semua origin secara default (mode demo).
// Jika FRONTEND_URL diisi, hanya domain itulah yang diperbolehkan.
const corsOrigin = process.env.FRONTEND_URL || '*';

// Basic middleware
app.use(cors({ origin: corsOrigin }));
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
if (!isVercel) {
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
