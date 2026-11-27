# evil-redirect — Demo Open Redirect (deploy terpisah)

Project Next.js kecil yang sengaja dibuat **rentan terhadap Open Redirect** untuk
keperluan demo/tugas. Folder ini berada di root repository `IO-Chat` tetapi
dideploy sebagai **project Vercel kedua** (dua deploy, satu repo).

> **Peringatan:** Hanya untuk demo lokal/edukasi. Jangan pernah deploy halaman ini
> untuk mencuri kredensial. Form login di sini **tidak mengirim data ke mana pun** —
> tidak ada email/username/password yang disimpan atau dikirim ke server.

## Isi project

| Route | Fungsi |
|-------|--------|
| `/` | Salinan visual halaman login/register I/O Chat. Saat form disubmit, halaman langsung redirect sesuai parameter / tujuan default. |
| `/login` | Alias dari halaman login tiruan di atas. |
| `/redirect?url=...` | **Open Redirect**: redirect tanpa validasi ke URL apa pun (`url`, `redirect`, atau `next`). |

Tujuan redirect default adalah halaman login I/O Chat asli
(`NEXT_PUBLIC_IOCHAT_LOGIN_URL`, default `http://localhost:3000`).

## Menjalankan lokal

IO-Chat Frontend berjalan di port **3000**. Project ini memakai port **3001**
supaya bisa diuji sebagai dua "domain" berbeda.

```bash
# terminal 1 — aplikasi asli
cd "IO-Chat/IO-Chat-Frontend"
npm install
npm run dev            # http://localhost:3000

# terminal 2 — project evil-redirect
cd "IO-Chat/evil-redirect"
npm install
npm run dev            # http://localhost:3001
```

Salin `.env.example` menjadi `.env.local` bila URL login I/O Chat berbeda:

```bash
cp .env.example .env.local
```

## Contoh PoC

```text
# 1. Halaman login tiruan (bait)
http://localhost:3001/

# 2. Open Redirect langsung ke login I/O Chat asli
http://localhost:3001/redirect?url=http://localhost:3000

# 3. Open Redirect ke domain sembarang (tanpa validasi)
http://localhost:3001/redirect?url=https://example.com

# 4. Open Redirect setelah submit form login tiruan
http://localhost:3001/?redirect=https://example.com
```

Alur phishing yang didemonstrasikan:

1. Korban membuka link ke domain penyerang (`localhost:3001`).
2. Korban melihat halaman login yang tampak identik dengan I/O Chat.
3. Saat korban menekan **Login**, halaman mengalihkan ke halaman login asli
   (`localhost:3000`) — atau ke URL apa pun yang dipilih penyerang.

## Deploy (satu repo, dua project Vercel)

Repository `IO-Chat` menjadi **satu-satunya repo** untuk semua deploy. Buat dua
project Vercel dari repo yang sama, dibedakan lewat **Root Directory**:

### Project 1 — Frontend I/O Chat

| Field | Nilai |
|-------|-------|
| Import | repo `IO-Chat` |
| Root Directory | `IO-Chat-Frontend` |
| Framework Preset | Next.js |
| Build Command | `npm run build` (otomatis) |

Environment variable:

```text
NEXT_PUBLIC_BACKEND_URL=https://<domain-backend>   # opsional, jika memakai process.env
```

### Project 2 — evil-redirect

| Field | Nilai |
|-------|-------|
| Import | repo `IO-Chat` (sama) |
| Root Directory | `evil-redirect` |
| Framework Preset | Next.js |
| Build Command | `npm run build` (otomatis) |

Environment variable (wajib diisi):

```text
NEXT_PUBLIC_IOCHAT_LOGIN_URL=https://<domain-frontend-io-chat>
```

> **Penting:** `NEXT_PUBLIC_*` harus ada **sebelum build**, karena Next.js
> men-*inline* nilai itu ke dalam bundle. Set di **Settings → Environment Variables**
> lalu **Redeploy**, jangan hanya simpan setelah deploy.

Setelah itu ganti contoh `http://localhost:3000` pada PoC di atas dengan domain
frontend I/O Chat, dan `http://localhost:3001` dengan domain evil-redirect.

## Catatan

- `IO-Chat-Frontend` sudah dibersihkan dari `link.evil`, route `/redirect`,
  redirect pasca-login, dan endpoint `/api/auth/redirect`. Semua jalur Open Redirect
  sekarang hanya ada di folder `evil-redirect/`.
- Kredensial yang diketik di halaman tiruan tidak dikirim, disimpan, atau
  di-log. Form hanya melakukan redirect.
