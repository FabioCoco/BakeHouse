# BakeHouse

Toko roti artisan online dengan dashboard admin. Monorepo: `server/` (Express + MongoDB) dan `client/` (Vite + React).

## Screenshots

<!-- Replace these placeholders with real screenshots before release. -->

| Beranda | Katalog | Detail produk |
| --- | --- | --- |
| _screenshot placeholder_ | _screenshot placeholder_ | _screenshot placeholder_ |

| Checkout (Midtrans Snap) | Dashboard admin | Pengaturan admin |
| --- | --- | --- |
| _screenshot placeholder_ | _screenshot placeholder_ | _screenshot placeholder_ |

## Features

| Rubrik | Yang tersedia |
| --- | --- |
| **Landing** | Hero video dengan poster, pengumuman di atas navbar, carousel banner promo yang dikelola admin, "Sedang Promo", "Baru Keluar dari Oven", bagian asal roti, dan "Cara Pesan". |
| **Products** | Katalog dengan pencarian, filter kategori, asal, dan promo, serta pengurutan termasuk diskon terbesar. Detail produk dengan gambar, harga diskon, stok, dan ulasan. |
| **Authentication** | Daftar dan masuk dengan email dan kata sandi, atau dengan Google Sign-In. Sesi disimpan di cookie httpOnly. Ada dua peran: `customer` dan `admin`. |
| **User Profile** | Ubah nama dan nomor telepon, ganti kata sandi (tidak tersedia untuk akun Google), kelola alamat pengiriman, riwayat pesanan, dan ulasan. |
| **Cart** | Keranjang tersimpan di server dan ikut berpindah antar perangkat. Ubah jumlah dan hapus item dengan pembaruan optimistik. Stok dicek ulang setiap perubahan. |
| **Checkout & Payment** | Checkout dari keranjang atau langsung dari "Beli Sekarang". Pembayaran lewat Midtrans Snap (sandbox). Pesanan diberi batas waktu pembayaran 24 jam. Saat Midtrans melaporkan kedaluwarsa, pesanan dibatalkan dan stoknya dikembalikan. |
| **Admin Dashboard** | Analitik dengan rentang 7, 30, atau 90 hari. KPI dengan perbandingan periode sebelumnya, pendapatan per hari, produk terlaris, pendapatan per kategori, konversi pembayaran, dan stok menipis. |
| **All Orders** | Daftar semua pesanan dengan filter status dan pencarian nomor. Detail pesanan dengan riwayat status. Perubahan status hanya yang diizinkan alur pesanan. |
| **All Products** | Tambah, ubah, dan nonaktifkan produk. Unggah beberapa foto. Atur stok langsung di tabel. Atur diskon dengan tanggal mulai dan berakhir. |
| **Kategori dan ulasan** | Kelola kategori. Ulasan hanya dari pembeli dengan pesanan selesai, dan admin bisa menyembunyikan ulasan. |
| **Pengaturan toko** | Pengumuman dan banner promo (dengan unggah gambar). Kategori unggulan bisa diatur, tetapi belum dipakai di beranda. |

## Tech stack

- **Server:** Node.js, Express 4, Mongoose 8 (MongoDB Atlas), JWT di cookie httpOnly, express-validator, multer, midtrans-client, Jest, Supertest, mongodb-memory-server.
- **Client:** Vite 8, React 19, React Router 7, Zustand, Axios, Tailwind CSS 4, recharts, lucide-react, react-hot-toast, @react-oauth/google.

## Struktur

```
bakehouse/
  server/   API, model, seed, dan tes
  client/   aplikasi web (storefront dan admin)
```

## Requirements

- Node.js 20.19+ atau 22.12+
- Cluster MongoDB Atlas (atau MongoDB dengan replica set, karena checkout memakai transaksi)
- Akun sandbox Midtrans (untuk pembayaran)
- Opsional: Google Cloud client ID (untuk Google Sign-In)

## Setup

```bash
# 1. Server
cd server
cp .env.example .env        # isi nilai di bawah
npm install
npm run seed                # hanya untuk database kosong, lihat catatan
npm run dev                 # http://localhost:5000

# 2. Client (terminal lain)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Vite meneruskan `/api` dan `/uploads` ke server, jadi cookie sesi tetap berada pada origin yang sama selama development.

Catatan seed: `npm run seed` menolak jalan di database yang sudah berisi data. Untuk mengulang, jalankan `npm run seed:destroy` lalu `npm run seed`. Perintah destroy menghapus semua data BakeHouse, termasuk akun dan pesanan.

## Scripts

| Lokasi | Perintah | Fungsi |
| --- | --- | --- |
| `server` | `npm run dev` | Server dengan nodemon di port 5000 |
| `server` | `npm start` | Server tanpa nodemon |
| `server` | `npm run seed` | Mengisi database kosong: admin, pelanggan demo, kategori, produk, pesanan dan ulasan contoh |
| `server` | `npm run seed:destroy` | Menghapus semua data BakeHouse |
| `server` | `npm test` | Seluruh tes (MongoDB in-memory) |
| `client` | `npm run dev` | Vite dev server di port 5173 |
| `client` | `npm run build` | Build production ke `client/dist` |
| `client` | `npm run preview` | Menjalankan build di port 4173 |

## Environment variables

### `server/.env`

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `MONGODB_URI` | Ya | Connection string Atlas, dengan replica set |
| `JWT_SECRET` | Ya | Minimal 32 karakter |
| `MIDTRANS_SERVER_KEY` | Ya | Server key sandbox (`SB-Mid-server-...`) |
| `MIDTRANS_CLIENT_KEY` | Ya | Client key sandbox (`SB-Mid-client-...`) |
| `MIDTRANS_IS_PRODUCTION` | Tidak | `false` (default) untuk sandbox |
| `PORT` | Tidak | Default 5000 |
| `CLIENT_URL` | Tidak | Asal frontend untuk CORS dan tautan kembali dari Midtrans. Default `http://localhost:5173` |
| `JWT_EXPIRES_IN` | Tidak | Default `7d` |
| `COOKIE_SAME_SITE` | Tidak | `lax` (dev) atau `none` (production, butuh HTTPS) |
| `GOOGLE_CLIENT_ID` | Tidak | Kosong berarti Google Sign-In dinonaktifkan |
| `AUTH_RATE_LIMIT_MAX` | Tidak | Batas percobaan auth per 15 menit per IP |
| `SHIPPING_FEE` | Tidak | Ongkir dalam rupiah |
| `FREE_SHIPPING_THRESHOLD` | Tidak | Subtotal minimal untuk gratis ongkir |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Untuk seed | Akun admin |
| `SEED_CUSTOMER_PASSWORD` | Untuk seed | Kata sandi pelanggan demo |

### `client/.env`

| Variabel | Keterangan |
| --- | --- |
| `VITE_API_URL` | Default `/api`. Biarkan begitu saat development. |
| `VITE_GOOGLE_CLIENT_ID` | Kosong menyembunyikan tombol Google |
| `VITE_MIDTRANS_CLIENT_KEY` | Harus sama dengan `MIDTRANS_CLIENT_KEY` di server |
| `VITE_MIDTRANS_IS_PRODUCTION` | `false` untuk sandbox |

## Payment (Midtrans Sandbox)

Pembayaran memakai Midtrans Snap dalam mode sandbox. Tidak ada uang nyata yang berpindah.

**1. Kunci**

Ambil server key dan client key sandbox dari dashboard Midtrans di menu Settings, lalu Access Keys. Isi `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` di `server/.env`, dan `VITE_MIDTRANS_CLIENT_KEY` di `client/.env`. Server tidak akan jalan tanpa dua kunci server.

**2. Webhook (opsional untuk development)**

Midtrans mengirim status pembayaran ke server lewat webhook. Webhook butuh alamat publik, jadi di komputer lokal gunakan ngrok:

```bash
ngrok http 5000
```

Di dashboard Midtrans, buka Settings, lalu Configuration, dan isi **Payment Notification URL** dengan:

```
https://<subdomain-ngrok>.ngrok-free.app/api/payments/midtrans/notification
```

Tanpa webhook, status pesanan tetap diperbarui. Halaman pesanan memeriksa status ke Midtrans saat dibuka dan setelah popup pembayaran ditutup.

**3. Mencoba pembayaran**

- Pilih bank transfer di Snap, lalu buka simulator sandbox Midtrans dan selesaikan pembayarannya.
- Untuk kartu kredit, pakai kartu uji dari dokumentasi Midtrans. Kartu uji dan kode OTP sandbox bisa berubah, jadi cek dokumentasi terbaru.
- Batas pembayaran 24 jam dihitung dari pembuatan pesanan. Pesanan dibatalkan dan stoknya dikembalikan saat Midtrans melaporkan kedaluwarsa, atau saat status diperiksa dari halaman pesanan. Tidak ada job terjadwal, jadi pesanan yang tidak pernah diperiksa bisa tetap menunggu dan menahan stok.

**4. Catatan**

- Membatalkan pesanan yang sudah lunas hanya menandainya "Dikembalikan". Tidak ada dana yang dikirim, dan refund harus dilakukan manual di dashboard Midtrans.
- Jika pembayaran masuk setelah pesanan dibatalkan, server hanya mencatat peringatan. Pesanan itu tidak diaktifkan lagi, dan refund perlu dilakukan manual.

## Akun demo

Setelah `npm run seed`:

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` |
| Pelanggan | `rina@example.com`, `budi@example.com`, `dewi@example.com`, `andi@example.com`, `sari@example.com`, `yoga@example.com` | `SEED_CUSTOMER_PASSWORD` |

Admin login langsung ke `/admin`. Pelanggan kembali ke beranda atau ke halaman yang tadi dibuka.

## Tes

```bash
cd server
npm test
```

Tes memakai MongoDB in-memory. Pada pemakaian pertama, library mengunduh binary MongoDB (sekitar 800 MB). Folder tujuannya bisa diatur dengan variabel `MONGOMS_DOWNLOAD_DIR`, dan folder sementara bisa diarahkan ke drive lain dengan `TEMP`. Tes menulis file upload sementara dan menghapusnya sendiri.

Cakupan: auth, produk, keranjang, checkout, pembayaran (verifikasi signature, mapping status, idempotensi, kegagalan Snap), buy now, diskon, ulasan, profil dan pengaturan, analitik, dan upload.

## Out of scope

- Pengiriman dan pelacakan kurir. Ongkir dihitung sederhana berdasarkan subtotal.
- Pengiriman email (konfirmasi pesanan, reset kata sandi).
- Refund otomatis. Refund dilakukan manual.
- Job terjadwal untuk pesanan yang kedaluwarsa tanpa notifikasi.
- Pemakaian kategori unggulan di beranda.
- Filter stok di katalog.
- Multi-mata uang dan pajak.
- Pengelolaan stok multi-gudang.
