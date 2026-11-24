import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { initializeSockets } from './sockets/index.js';

dotenv.config();

import { initDb } from './database/index.js';
initDb();

const app = express();
const httpServer = http.createServer(app);

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

// API routes
app.use('/api', routes);

// Sockets
initializeSockets(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
// Nodemon trigger restart
