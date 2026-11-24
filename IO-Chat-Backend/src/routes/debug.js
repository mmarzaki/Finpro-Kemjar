import express from 'express';
import bcrypt from 'bcrypt';

const router = express.Router();

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
