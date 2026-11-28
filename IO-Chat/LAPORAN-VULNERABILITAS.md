# Laporan Perubahan — Simulasi Vulnerability Open Redirect & Denial of Service (DoS)

> **Catatan penting:** Seluruh perubahan di bawah dibuat **hanya untuk keperluan belajar/demo lokal**
> pada aplikasi I/O Chat yang dijalankan sendiri (localhost). Tidak ada kredensial yang
> dikumpulkan, disimpan, atau dikirim ke server mana pun dari project simulasi `evil-redirect`.
> Jangan menerapkan konfigurasi ini pada aplikasi yang dapat diakses publik.

---

## 1. Ringkasan Perubahan

Open Redirect sekarang berada di folder tersendiri di dalam repository `IO-Chat` (`evil-redirect/`), sedangkan
aplikasi utama `IO-Chat-Frontend` dibersihkan dari semua jalur redirect. DoS tetap berada di backend `IO-Chat`.

| No | File | Perubahan | Jenis |
|----|------|-----------|-------|
| 1 | `evil-redirect/` (folder baru) | Salinan visual halaman login I/O Chat + route `/redirect?url=...` yang melakukan redirect tanpa validasi. Dideploy sebagai Vercel project terpisah dari satu repo. | Open Redirect |
| 2 | `IO-Chat-Frontend/src/app/link.evil/` | **Dihapus.** Halaman login palsu tidak lagi berada di dalam aplikasi asli. | Pembersihan |
| 3 | `IO-Chat-Frontend/src/app/redirect/` | **Dihapus.** Route `/redirect` milik aplikasi asli dihapus. | Pembersihan |
| 4 | `IO-Chat-Frontend/src/app/page.js` | Redirect pasca-login/register (`?redirect=` / `?next=`) **dihapus**. | Pembersihan |
| 5 | `IO-Chat-Backend/src/routes/auth.js` | Endpoint `GET /api/auth/redirect` **dihapus**. | Pembersihan |
| 6 | `IO-Chat-Backend/src/routes/debug.js` | **Baru.** Endpoint `/api/debug/bcrypt?cost=` dan `/api/debug/cpu?iterations=` yang memblokir event loop. | DoS |
| 7 | `IO-Chat-Backend/src/routes/index.js` | Mendaftarkan router `debug`. | DoS |
| 8 | `IO-Chat-Backend/src/server.js` | Rate limiter dinonaktifkan; batas body JSON dinaikkan `5mb → 50mb`. | DoS |

---

## 2. Open Redirect

### 2.1 Arsitektur dua deploy

Open Redirect sengaja dipisahkan dari aplikasi utama agar skenarionya menyerupai
serangan nyata: aplikasi I/O Chat yang asli bersih, sedangkan halaman penipu
dihosting di project/domain milik penyerang.

#### a) Deploy 1 — `IO-Chat` (aplikasi asli)

Semua jalur Open Redirect dihapus agar aplikasi utama tidak lagi bisa dipakai
sebagai "jembatan" redirect:

- `IO-Chat-Frontend/src/app/link.evil/` dihapus.
- `IO-Chat-Frontend/src/app/redirect/` dihapus.
- Redirect pasca-login/register dari parameter `?redirect=` / `?next=` di
  `handleAuth()` (`src/app/page.js`) dihapus.
- Endpoint backend `GET /api/auth/redirect` (`src/routes/auth.js`) dihapus.

#### b) Deploy 2 — `evil-redirect/` (project baru)

Project Next.js terpisah di root repository. Saat dijalankan lokal memakai
port **3001**, sehingga bisa diuji berdampingan dengan I/O Chat di port 3000.

Isi project:

- **`/` dan `/login`** — salinan visual halaman login/register I/O Chat:
  kartu `w-96`, header merah `bg-red-600` bertuliskan **"I/O Chat"**,
  teks **"Welcome back!" / "Create an account"**, input Email, Username
  (saat register), Password, tombol **Login / Register**, tautan toggle
  register/login, serta dark mode & accent color dari `localStorage`.
- **`/redirect?url=...`** — route **Open Redirect**. Menerima `url`,
  `redirect`, atau `next` dari query string lalu memanggil
  `window.location.replace(target)` tanpa validasi origin/domain.
  Tujuan default adalah `NEXT_PUBLIC_IOCHAT_LOGIN_URL`
  (default `http://localhost:3000`, yaitu halaman login I/O Chat asli).
- Form login tiruan **tidak mengirim kredensial** ke mana pun. Saat disubmit,
  halaman hanya melakukan redirect ke parameter URL atau ke login I/O Chat asli.

### 2.2 Contoh PoC (lokal)

Dengan I/O Chat di `localhost:3000` dan `evil-redirect` di `localhost:3001`:

```
# Halaman login tiruan (bait)
http://localhost:3001/

# Open Redirect langsung ke halaman login I/O Chat asli
http://localhost:3001/redirect?url=http://localhost:3000

# Open Redirect ke domain sembarang (tanpa validasi)
http://localhost:3001/redirect?url=https://example.com

# Redirect setelah submit form login tiruan
http://localhost:3001/?redirect=https://example.com
```

Alur phishing yang didemonstrasikan:

1. Korban membuka link ke domain penyerang (`localhost:3001`).
2. Korban melihat halaman login yang tampak identik dengan I/O Chat.
3. Saat korban menekan **Login**, halaman mengalihkan ke halaman login asli
   (`localhost:3000`) atau ke URL apa pun yang dipilih penyerang.

Dalam skenario nyata, penyerang mengganti `localhost:3001` dengan domain
miliknya dan `localhost:3000` dengan domain I/O Chat yang asli.

### 2.3 Dampak

- Korban melihat halaman login yang dipercayanya, padahal berada di domain lain.
- Dapat dipakai sebagai batu loncatan phishing, OAuth token leakage, dan malware delivery.
- Endpoint `/redirect` di project penyerang juga bisa dipakai sebagai "redirector" generik.

---

## 3. Denial of Service (DoS)

### 3.1 Apa yang diubah

#### a) Endpoint penguras CPU — `src/routes/debug.js`

- `GET /api/debug/bcrypt?cost=18`
  Memanggil `bcrypt.hashSync()` secara sinkron dengan `cost` dari query. Karena bcrypt dirancang
  mahal, `cost` besar membuat event loop Node.js sibuk terus dan request lain ikut tertahan.

- `GET /api/debug/cpu?iterations=2000000000`
  Loop `for` sinkron tanpa batas yang aman. Satu request dapat membuat satu core CPU penuh.

#### b) Konfigurasi server — `src/server.js`

- `app.use('/api/', apiLimiter)` **dikomentari** → tidak ada throttling request.
- Body parser diubah dari `express.json({ limit: '5mb' })` menjadi `limit: '50mb'`,
  sehingga payload besar lebih mudah dikirim (pengurasan memori).
- Socket.IO sebenarnya juga punya `maxHttpBufferSize: 5e6` dan validasi `file_size`
  yang **dipercaya dari client** — tetap menjadi catatan risiko tambahan (belum diubah).

### 3.2 Contoh PoC (lokal)

```
# Satu request, blockage beberapa detik
curl "http://localhost:4000/api/debug/bcrypt?cost=17"

# Satu request, CPU 100%
curl "http://localhost:4000/api/debug/cpu?iterations=2000000000"

# Kirim payload besar karena limit 50mb dan tanpa rate limit
for i in $(seq 1 500); do curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"a@b.c","password":"x"}' & done; wait
```

Perhatikan bahwa endpoint `/api/debug/*` berada di bawah prefix `/api/`, tetapi karena rate limiter
dinonaktifkan dan biaya per request ditentukan client, satu request saja sudah cukup — ini pelajaran
penting: **rate limiting berbasis jumlah request tidak melindungi dari request yang mahal**.

### 3.3 Dampak

- Event loop terblokir → seluruh pengguna chat mengalami timeout.
- Konsumsi CPU/memori meningkat → server bisa crash (OOM) atau restart (mengganggu presence Redis).
- Tidak ada pembatasan brute-force pada `/api/auth/login` dan `/api/auth/register`.

---

## 4. Cara Menjalankan & Menguji

```bash
# Backend
cd IO-Chat-Backend
npm install
npm run dev        # http://localhost:4000

# Frontend I/O Chat (terminal lain)
cd IO-Chat-Frontend
npm install
npm run dev        # http://localhost:3000

# Project evil-redirect (terminal ketiga)
cd "evil-redirect"
npm install
npm run dev        # http://localhost:3001
```

Buka URL PoC pada browser. Untuk mengamati efek DoS, jalankan salah satu `curl` di atas lalu
coba akses `http://localhost:4000/api/auth/me` dari tab lain — respons akan tertunda.

Untuk demo Open Redirect, buka `http://localhost:3001/` (halaman login tiruan) atau
`http://localhost:3001/redirect?url=https://example.com`.

---

## 5. Cara Memperbaiki (Remediation)

Bagian ini sengaja ditambahkan agar laporan lengkap sebagai materi belajar.

### Open Redirect
- Jangan pernah langsung memakai `req.query.url` / `params.redirect`.
- Gunakan **allowlist** relatif: terima hanya path yang diawali `/` dan bukan `//` atau `/\`,
  atau cocokkan hostname dengan `new URL(target, location.origin).origin === location.origin`.
- Di backend, tolak URL dengan scheme selain `http/https` dan domain di luar allowlist.
- Tambahkan header `Referrer-Policy: no-referrer` dan `Content-Security-Policy` untuk mengurangi dampak.

### Project `evil-redirect`
- Hapus project simulasi setelah demo selesai.
- Jangan pernah menaruh form yang mengirim kredensial ke domain di luar aplikasi.
- Edukasi pengguna: periksa hostname di address bar sebelum login.

### DoS
- Aktifkan kembali `app.use('/api/', apiLimiter)` dan tambahkan limiter lebih ketat pada `/api/auth/*`.
- Kembalikan `express.json({ limit: '100kb' })` (atau sesuai kebutuhan nyata).
- Hilangkan endpoint `/api/debug/*` dari build produksi; jangan pernah menerima `cost`/`iterations` dari client.
- Gunakan versi async (`bcrypt.hash`) atau worker thread / queue agar tidak memblokir event loop.
- Validasi ukuran file di server dari hasil dekode base64, bukan dari `file_size` yang dikirim client.
- Pasang reverse proxy (nginx/Cloudflare) dengan connection & body size limits dan timeout.

---

## 6. Kesimpulan

Perubahan di atas menciptakan dua kelas kerentanan yang mudah didemonstrasikan:

1. **Open Redirect** — berada di project/deploy terpisah `evil-redirect`, yang memuat salinan
   visual halaman login I/O Chat dan route `/redirect?url=...` tanpa validasi.
   Aplikasi `IO-Chat` sendiri sudah dibersihkan dari jalur redirect tersebut.
2. **DoS** — event loop dapat diblokir melalui endpoint debug, ditambah rate limiting yang mati
   dan batas body yang diperlonggar.

Semua perubahan bersifat **lokal dan edukatif**; kredensial tidak pernah ditangkap oleh halaman simulasi.
