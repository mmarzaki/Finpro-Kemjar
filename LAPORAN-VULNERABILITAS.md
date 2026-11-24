# Laporan Perubahan — Simulasi Vulnerability Open Redirect & Denial of Service (DoS)

> **Catatan penting:** Seluruh perubahan di bawah dibuat **hanya untuk keperluan belajar/demo lokal**
> pada aplikasi I/O Chat yang dijalankan sendiri (localhost). Tidak ada kredensial yang
> dikumpulkan, disimpan, atau dikirim ke server mana pun dari halaman simulasi `link.evil`.
> Jangan menerapkan konfigurasi ini pada aplikasi yang dapat diakses publik.

---

## 1. Ringkasan Perubahan

| No | File | Perubahan | Jenis |
|----|------|-----------|-------|
| 1 | `IO-Chat-Frontend/src/app/link.evil/page.js` | **Baru.** Halaman login/register palsu yang tampilan visualnya sengaja dibuat identik dengan halaman auth asli di `page.js`. | Open Redirect / Phishing demo |
| 2 | `IO-Chat-Frontend/src/app/redirect/page.js` | **Baru.** Route `/redirect?url=...` yang melakukan redirect tanpa validasi. | Open Redirect |
| 3 | `IO-Chat-Frontend/src/app/page.js` | Menambahkan redirect pasca-login/register dari parameter `?redirect=` / `?next=`. | Open Redirect |
| 4 | `IO-Chat-Backend/src/routes/auth.js` | Menambahkan `GET /api/auth/redirect?url=...` yang memakai `res.redirect()` langsung. | Open Redirect |
| 5 | `IO-Chat-Backend/src/routes/debug.js` | **Baru.** Endpoint `/api/debug/bcrypt?cost=` dan `/api/debug/cpu?iterations=` yang memblokir event loop. | DoS |
| 6 | `IO-Chat-Backend/src/routes/index.js` | Mendaftarkan router `debug`. | DoS |
| 7 | `IO-Chat-Backend/src/server.js` | Rate limiter dinonaktifkan; batas body JSON dinaikkan `5mb → 50mb`. | DoS |

---

## 2. Open Redirect

### 2.1 Apa yang diubah

#### a) Halaman tujuan palsu (`link.evil`)
Dibuat route App Router baru:

```
IO-Chat-Frontend/src/app/link.evil/page.js   →  http://localhost:3000/link.evil
```

Isinya adalah **salinan persis** dari blok UI autentikasi pada `src/app/page.js` (baris ~494–552):

- struktur `div` + kelas Tailwind yang sama (`flex items-center justify-center h-screen bg-gray-100 ...`),
- kartu `rounded-2xl shadow-2xl w-96`,
- header merah `bg-red-600` dengan teks **"I/O Chat"** dan **"Welcome back!" / "Create an account"**,
- input Email, Username (saat register), Password,
- tombol **Login / Register**,
- tautan **"Need an account? Register" / "Already have an account? Login"**,
- tema gelap & accent color dari `localStorage` (`isDarkMode`, `selectedAccent`) mengikuti page asli.

Perbedaan satu-satunya: **tidak ada request jaringan**. Jika form disubmit, hanya muncul pesan:

```
Open Redirect Simulation (link.evil): Form submitted on spoofed page.
No credentials were captured or transmitted.
```

Artinya halaman ini murni *visual clone* untuk mendemonstrasikan risiko, bukan alat pencurian kredensial.

> **Clarification — kenapa `link.evil` ada di dalam repo?**
> Pada serangan nyata, halaman phishing **tidak pernah ditaruh di source code aplikasi korban**.
> Penyerang meng-host halaman tiruan itu di domain/server miliknya sendiri (mis.
> `link-evil.com`, `login-iochat.site`, atau hosting gratis). Kerentanan di aplikasi korban
> hanya berupa *endpoint redirect yang tidak divalidasi* — itulah "jembatan" yang membuat
> URL tetap terlihat berasal dari domain tepercaya sebelum korban dialihkan.
>
> Di project ini, route `/link.evil` sengaja dibuat sebagai **stand-in lokal** untuk
> "attacker-controlled external site" karena tidak memungkinkan mendaftarkan domain eksternal
> dalam tugas kampus. Dengan begitu seluruh rantai bisa diuji di `localhost:3000` +
> `localhost:4000`. Saat menulis laporan nyata, sebutlah halaman ini sebagai situs eksternal
> milik penyerang, bukan bagian dari aplikasi I/O Chat.
>
> Alternatif demo yang lebih realistis: jalankan server kedua di `localhost:3001` sebagai
> "domain penyerang" lalu arahkan `?url=http://localhost:3001/...`, atau pakai dua hostname
> lokal lewat file hosts (`io-chat.test` vs `link.evil.test`).

#### b) Tiga jalur redirect yang tidak divalidasi

1. **Frontend – helper redirect**
   `src/app/redirect/page.js` mengambil `url`, `redirect`, atau `next` dari query string lalu
   `window.location.replace(target)` tanpa mengecek origin/domain.

2. **Frontend – setelah login/register berhasil**
   Di `handleAuth()` (`src/app/page.js`), setelah token tersimpan:

   ```js
   const params = new URLSearchParams(window.location.search);
   const redirectUrl = params.get('redirect') || params.get('next');
   if (redirectUrl) window.location.href = redirectUrl;
   ```

3. **Backend – endpoint resmi**
   `GET /api/auth/redirect?url=<target>` memanggil `res.redirect(target)` apa adanya.

### 2.2 Contoh PoC (lokal)

Dengan frontend di `localhost:3000` dan backend di `localhost:4000`:

```
# Melalui route redirect frontend
http://localhost:3000/redirect?url=http://localhost:3000/link.evil

# Melalui halaman login (setelah kredensial valid)
http://localhost:3000/?redirect=http://localhost:3000/link.evil

# Melalui backend
http://localhost:4000/api/auth/redirect?url=http://localhost:3000/link.evil
```

Ketiga URL tersebut akhirnya menampilkan halaman `link.evil` yang tampak sama persis dengan
halaman login I/O Chat asli. Dalam skenario nyata, penyerang mengganti `localhost:3000`
dengan domain miliknya — inilah yang mendemonstrasikan bahaya Open Redirect.

### 2.3 Dampak

- Korban melihat halaman login yang dipercayanya, padahal berada di domain lain.
- Dapat dipakai sebagai batu loncatan phishing, OAuth token leakage, dan malware delivery.
- Endpoint backend yang terbuka juga bisa dipakai pihak ketiga sebagai "redirector" generik.

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

# Frontend (terminal lain)
cd IO-Chat-Frontend
npm install
npm run dev        # http://localhost:3000
```

Buka URL PoC pada browser. Untuk mengamati efek DoS, jalankan salah satu `curl` di atas lalu
coba akses `http://localhost:4000/api/auth/me` dari tab lain — respons akan tertunda.

---

## 5. Cara Memperbaiki (Remediation)

Bagian ini sengaja ditambahkan agar laporan lengkap sebagai materi belajar.

### Open Redirect
- Jangan pernah langsung memakai `req.query.url` / `params.redirect`.
- Gunakan **allowlist** relatif: terima hanya path yang diawali `/` dan bukan `//` atau `/\`,
  atau cocokkan hostname dengan `new URL(target, location.origin).origin === location.origin`.
- Di backend, tolak URL dengan scheme selain `http/https` dan domain di luar allowlist.
- Tambahkan header `Referrer-Policy: no-referrer` dan `Content-Security-Policy` untuk mengurangi dampak.

### Halaman `link.evil`
- Hapus route simulasi setelah demo selesai.
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

1. **Open Redirect** — tiga jalur (frontend helper, pasca-login, backend endpoint) mengarah ke
   `link.evil`, yaitu halaman login/register yang identik secara visual dengan halaman asli.
2. **DoS** — event loop dapat diblokir melalui endpoint debug, ditambah rate limiting yang mati
   dan batas body yang diperlonggar.

Semua perubahan bersifat **lokal dan edukatif**; kredensial tidak pernah ditangkap oleh halaman simulasi.
