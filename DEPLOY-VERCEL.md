# Panduan Deploy Lengkap — I/O Chat + evil-redirect di Vercel (Satu Repo, Tiga Project)

Dokumen ini menjelaskan cara mendeploy **backend**, **frontend**, dan **evil-redirect**
dari **satu repository Git yang sama** (`IO-Chat`) menjadi tiga Vercel project terpisah.

---

## ⚠️ Hal penting sebelum mulai

### 1. Socket.IO tidak bisa berjalan di Vercel
Vercel memakai **serverless function** yang bersifat stateless dan tidak mendukung
koneksi WebSocket persisten. Konsekuensinya:

| Fitur | Status di Vercel |
|-------|------------------|
| REST API (register, login, /me, chats, messages, favorites) | ✅ Berfungsi |
| Endpoint DoS `/api/debug/bcrypt` & `/api/debug/cpu` | ✅ Berfungsi (HTTP biasa) |
| Chat real-time / Socket.IO | ❌ Tidak berfungsi (koneksi client akan gagal, ini normal) |
| Redis presence (`user:online:*`) | ❌ Tidak dipakai di Vercel |

Kode backend sudah disesuaikan: `src/server.js` mengekspor Express app, dan
Socket.IO + Redis **hanya dijalankan saat lokal / non-Vercel**.

### 2. Kredensial sudah tidak ikut ter-commit
File `IO-Chat-Backend/.env` sudah dihapus dari tracking Git dan `.gitignore`
sudah ditambahkan. Nilai aslinya sekarang hanya perlu diisi lewat
**Environment Variables di Vercel** (lihat Langkah 1).

> Untuk menjalankan backend secara lokal, buat ulang file `.env` (tidak akan
> ikut ke Git) berdasarkan `IO-Chat-Backend/.env.example`. Jika repo dibuat
> public, rotate `JWT_SECRET` dan password database lama.

### 3. Database sudah harus terisi
Deploy backend tidak akan membuat tabel `users`, `chats`, `messages`, dll.
Jalankan `IO-Chat-Backend/database_dump.sql` ke database Neon/Supabase Anda
melalui SQL Editor / `psql` **sebelum** deploy backend.

---

## LANGKAH 0 — Siapkan repo & push

Dari root repo `IO-Chat`:

```bash
git add .
git commit -m "Prepare Vercel deployment (backend serverless + evil-redirect)"
git remote -v                      # pastikan sudah pointing ke GitHub
git push origin main
```

Pastikan folder-folder ini ikut ter-push:

```
IO-Chat/
├── IO-Chat-Backend/
│   ├── api/index.js        ← BARU, entry point serverless
│   ├── vercel.json         ← BARU, rewrite /api/* → function
│   └── .env.example        ← BARU
├── IO-Chat-Frontend/
│   └── .env.example        ← BARU
└── evil-redirect/
    └── .env.example        ← sudah ada dari sebelumnya
```

---

## LANGKAH 1 — Deploy Backend

1. Buka https://vercel.com/new → **Import Git Repository** → pilih repo `IO-Chat`.
2. Pada halaman **Configure Project**:
   | Field | Nilai |
   |-------|-------|
   | Project Name | `io-chat-backend` (bebas) |
   | **Root Directory** | `IO-Chat-Backend` ← **wajib diubah** |
   | Framework Preset | **Other** |
   | Build Command | kosongkan (atau `npm install`) |
   | Output Directory | kosongkan |
   | Install Command | `npm install` |

3. Klik **Environment Variables**, tambahkan:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `postgresql://<user>:<password>@<host>/<db>?sslmode=require` |
   | `JWT_SECRET` | string acak rahasia, misal `io-chat-secret-2026-xyz` |

   > Jangan isi `PORT` — Vercel yang menentukan. `VERCEL=1` juga otomatis.

4. Klik **Deploy**.

5. Setelah selesai, cek health endpoint di browser:

   ```
   https://<project-backend>.vercel.app/api/debug/cpu?iterations=1000
   ```

   Harus muncul JSON seperti:

   ```json
   {"iterations":1000,"acc":21081.64,"elapsedMs":0}
   ```

6. Uji DoS (sesuaikan dengan batas waktu Vercel, maksimal 60 detik):

   ```
   https://<project-backend>.vercel.app/api/debug/bcrypt?cost=15
   https://<project-backend>.vercel.app/api/debug/cpu?iterations=2000000000
   ```

   `cost=15` ≈ 1–2 detik, `cost=17` ≈ 6–10 detik. Jangan pakai `cost=20+`
   karena akan kena `504 Gateway Timeout` (dan itu sebenarnya juga masih
   bagian dari demonstrasi DoS).

7. Salin URL backend Anda, contoh:
   `https://io-chat-backend.vercel.app`

---

## LANGKAH 2 — Deploy Frontend I/O Chat

1. https://vercel.com/new → **Import** repo `IO-Chat` **yang sama**.
2. Configure Project:

   | Field | Nilai |
   |-------|-------|
   | Project Name | `io-chat-frontend` |
   | **Root Directory** | `IO-Chat-Frontend` ← **wajib diubah** |
   | Framework Preset | **Next.js** (terdeteksi otomatis) |
   | Build Command | `npm run build` (default) |
   | Output Directory | `.next` (default) |

3. Environment Variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_BACKEND_URL` | `https://<project-backend>.vercel.app` (dari Langkah 1) |

   > `NEXT_PUBLIC_*` di-inline saat **build**. Jadi isi dulu di Settings →
   > Environment Variables, lalu Deploy/Redeploy. Mengisi setelah deploy
   > tidak akan langsung berubah.

4. Klik **Deploy**.

5. Uji:
   - Buka `https://<project-frontend>.vercel.app`
   - Register akun baru, lalu login.
   - Jika berhasil, token tersimpan di `localStorage` dan muncul daftar chat
     (kosong belum apa-apa karena data chat dikirim lewat Socket.IO yang
     tidak aktif di Vercel).

6. Salin URL frontend, contoh:
   `https://io-chat-frontend.vercel.app`

---

## LANGKAH 3 — Deploy evil-redirect (project ketiga, repo sama)

1. https://vercel.com/new → **Import** repo `IO-Chat` **lagi**.
2. Configure Project:

   | Field | Nilai |
   |-------|-------|
   | Project Name | `evil-redirect` |
   | **Root Directory** | `evil-redirect` ← **wajib diubah** |
   | Framework Preset | **Next.js** |
   | Build Command | `npm run build` (default) |
   | Output Directory | `.next` (default) |

3. Environment Variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_IOCHAT_LOGIN_URL` | `https://<project-frontend>.vercel.app` (dari Langkah 2) |

4. Klik **Deploy**.

5. Salin URL evil-redirect, contoh:
   `https://evil-redirect.vercel.app`

---

## LANGKAH 4 — Uji PoC akhir

Ganti placeholder dengan URL deploy Anda:

| PoC | URL |
|-----|-----|
| Halaman login tiruan (bait) | `https://evil-redirect.vercel.app/` |
| Alias login tiruan | `https://evil-redirect.vercel.app/login` |
| Open Redirect → login I/O Chat asli | `https://evil-redirect.vercel.app/redirect?url=https://io-chat-frontend.vercel.app` |
| Open Redirect → domain bebas | `https://evil-redirect.vercel.app/redirect?url=https://example.com` |
| Redirect setelah submit form | `https://evil-redirect.vercel.app/?redirect=https://example.com` |
| DoS CPU | `https://io-chat-backend.vercel.app/api/debug/cpu?iterations=2000000000` |
| DoS bcrypt | `https://io-chat-backend.vercel.app/api/debug/bcrypt?cost=17` |

Ringkasan tiga deploy:

```
Backend   → https://io-chat-backend.vercel.app   (Root Directory: IO-Chat-Backend)
Frontend  → https://io-chat-frontend.vercel.app  (Root Directory: IO-Chat-Frontend)
Evil      → https://evil-redirect.vercel.app     (Root Directory: evil-redirect)
```

---

## Troubleshooting

| Masalah | Penyebab & solusi |
|---------|-------------------|
| `404 NOT_FOUND` di `/api/auth/login` | Root Directory salah, atau `vercel.json` tidak ikut ter-push. Pastikan Root Directory = `IO-Chat-Backend`. |
| `500` / `ECONNREFUSED` database | `DATABASE_URL` salah atau belum ada SSL. Pastikan `?sslmode=require` dan tabel dari `database_dump.sql` sudah dijalankan. |
| Build backend gagal di `bcrypt` | Native module gagal compile. Ganti dependency ke `bcryptjs` (API `hash`/`compare` kompatibel) di `package.json` dan controller. |
| `NEXT_PUBLIC_BACKEND_URL` tidak berubah | Set env var dulu → **Redeploy** (env vars di-inline saat build). |
| Console browser banyak error `websocket` | Normal di Vercel — Socket.IO tidak didukung serverless. REST API tetap jalan. |
| DoS `504 Gateway Timeout` | Request melebihi `maxDuration` (60 detik di `vercel.json`). Turunkan `cost`/`iterations`, atau anggap sebagai bukti DoS. |
| Dua project Vercel bentrok nama | Tiap project punya domain unik; bedakan Project Name saat import. |

---

## Catatan etis

Semua simulasi ini hanya untuk pembelajaran lokal/tugas. Halaman `evil-redirect`
**tidak menyimpan atau mengirim kredensial** — form-nya hanya melakukan redirect.
Jangan gunakan teknik ini pada aplikasi atau domain yang bukan milik Anda.
