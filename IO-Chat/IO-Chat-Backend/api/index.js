// Entry point untuk Vercel serverless function.
// Vercel akan meneruskan semua request /api/* ke Express app ini lewat rewrites di vercel.json.
import app from '../src/server.js';

export default app;
