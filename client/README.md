# BakeHouse Client

Frontend toko roti BakeHouse dan dashboard admin. Dibangun dengan Vite, React, React Router, Zustand, Axios, dan Tailwind CSS. Backend ada di `../server` dan harus berjalan di `http://localhost:5000`.

## Requirements

- Node.js 20.19+ atau 22.12+ (Vite 8 membutuhkan versi ini)
- Server BakeHouse berjalan di `http://localhost:5000` (lihat `../server/.env.example`)

## Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Buka `http://localhost:5173`.

Vite meneruskan `/api` dan `/uploads` ke server di port 5000. Dengan begitu cookie auth httpOnly tetap berada pada origin yang sama selama development.

## Environment

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base URL API. Biarkan `/api` saat development agar lewat proxy Vite. |
| `VITE_GOOGLE_CLIENT_ID` | _(kosong)_ | Client ID Google Sign-In. Jika kosong, tombol Google disembunyikan. Server juga perlu `GOOGLE_CLIENT_ID` yang sama. |

Jangan commit file `.env`.

## Scripts

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server di port 5173 dengan proxy ke server |
| `npm run build` | Build production ke `dist/` |
| `npm run preview` | Menjalankan hasil build di port 4173, dengan proxy yang sama |

Halaman `/styleguide` hanya tersedia di mode development, untuk memeriksa palet, tipografi, dan komponen dasar.

## Structure

```
src/
  api/          Instance Axios. Menormalkan error ke { message, errors, status }.
  components/   ui/ (primitive), layout/, home/, product/, cart/, order/, admin/, auth/
  config/       Konfigurasi hero, data toko, dan katalog (origin dan sort)
  hooks/        useFetch, useInView, useDebounce, useQueryParams, useCart, dll.
  pages/        Halaman customer, pages/admin/ untuk dashboard admin
  routes/       Router, ProtectedRoute (login), AdminRoute (role admin)
  services/     Pemanggil API per domain (auth, product, cart, order, address, admin)
  store/        Zustand: useAuthStore, useCartStore, useUIStore
  utils/        Format Rupiah dan tanggal, validasi (mengikuti server), status pesanan
```

## Notes

- Token auth disimpan sebagai cookie httpOnly oleh server. Frontend tidak pernah menyimpan token di JavaScript.
- Sesi dipulihkan dengan `GET /auth/me` saat aplikasi dibuka. Selama pengecekan itu, splash ditampilkan sehingga halaman yang dilindungi tidak berkedip.
- Keranjang disinkronkan dari server. Perubahan jumlah dan penghapusan bersifat optimistik dan dikembalikan jika server menolak.
- Rekening transfer hanya dikembalikan saat checkout. Frontend menyimpannya per pesanan di `sessionStorage` agar halaman sukses tetap menampilkannya setelah refresh.
- Gambar produk dimuat dari `/uploads/<nama-file>`. Jika file belum ada, ditampilkan placeholder.

## Known limitations

- Daftar produk admin hanya menampilkan produk aktif, karena `GET /products` memang hanya mengembalikan produk aktif. Produk yang disembunyikan tidak bisa dikelola lagi dari UI sampai ada endpoint admin untuk semua produk.
- Ongkos kirim dan total belum tersedia di cart. Keduanya baru dihitung oleh server saat pesanan dibuat.
- Unggah gambar belum tersedia. Nama file gambar diisi manual.
- Alamat pesanan dari checkout tidak otomatis disimpan ke buku alamat.

## Verifikasi

- `npm run build` berhasil.
- Lighthouse pada build preview (Chrome headless, throttling default), mobile: accessibility 94–100, best practices 96, SEO 100 di beranda dan katalog. Performa 74–82; skor ini bervariasi antar run dan dipengaruhi video hero.
