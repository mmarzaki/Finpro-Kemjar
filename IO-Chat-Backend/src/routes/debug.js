import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database/index.js';

const router = express.Router();

// Diagnostic: cek apakah koneksi DATABASE_URL hidup.
router.get('/db', async (req, res) => {
  try {
    const result = await query('SELECT 1 AS ok');
    res.json({ ok: true, result: result.rows });
  } catch (err) {
    console.error('[dbcheck] error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * VULNERABLE (DoS - CPU exhaustion):
 * Cost factor dikendalikan sepenuhnya oleh client. bcrypt.hashSync bersifat
 * sinkron sehingga memblokir event loop Node.js. Satu request dengan cost
 * besar dapat menghentikan semua request lain selama beberapa detik/menit.
 */
router.get('/bcrypt', (req, res) => {
  const cost = Number.parseInt(req.query.cost, 10) || 10;
  const start = Date.now();
  bcrypt.hashSync('io-chat-dos-demo', cost);
  res.json({ cost, elapsedMs: Date.now() - start });
});

/**
 * VULNERABLE (DoS - Algorithmic complexity):
 * Loop sinkron tanpa batas/blocking. Nilai iterations dari query parameter
 * dipakai langsung sehingga request tunggal dapat memakan CPU 100%.
 */
router.get('/cpu', (req, res) => {
  const iterations = Number.parseInt(req.query.iterations, 10) || 1000;
  const start = Date.now();
  let acc = 0;
  for (let i = 0; i < iterations; i++) {
    acc += Math.sqrt(i);
  }
  res.json({ iterations, acc, elapsedMs: Date.now() - start });
});

export default router;
