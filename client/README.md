# BakeHouse Client

The storefront and admin dashboard for BakeHouse. Built with Vite, React, React Router, Zustand, Axios, and Tailwind CSS. The backend lives in `../server` and must be running at `http://localhost:5000`.

## Requirements

- Node.js 20.19+ or 22.12+ (Vite 8 needs one of these)
- The BakeHouse server running at `http://localhost:5000` (see `../server/.env.example`)

## Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Then open `http://localhost:5173`.

Vite proxies `/api` and `/uploads` to the server on port 5000, so the httpOnly auth cookie stays on the same origin during development.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | API base URL. Keep `/api` in development so requests go through the Vite proxy. |
| `VITE_GOOGLE_CLIENT_ID` | _(empty)_ | Google Sign-In client ID. If empty, the Google button is hidden. The server needs the same value in `GOOGLE_CLIENT_ID`. |

Don't commit your `.env` file.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 5173, proxying to the server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the build on port 4173, with the same proxy |

The `/styleguide` page is only available in development. Use it to check the palette, typography, and base components.

## Structure

```
src/
  api/          Axios instance. Normalizes errors to { message, errors, status }.
  components/   ui/ (primitives), layout/, home/, product/, cart/, order/, admin/, auth/
  config/       Hero config, store data, and catalog options (origin and sort)
  hooks/        useFetch, useInView, useDebounce, useQueryParams, useCart, and others
  pages/        Customer pages, plus pages/admin/ for the admin dashboard
  routes/       Router, ProtectedRoute (requires login), AdminRoute (requires admin role)
  services/     API callers by domain (auth, product, cart, order, address, admin)
  store/        Zustand stores: useAuthStore, useCartStore, useUIStore
  utils/        Rupiah and date formatting, validation (mirrors the server), order statuses
```

## Notes

- The server stores the auth token in an httpOnly cookie. The frontend never keeps the token in JavaScript.
- The session is restored with `GET /auth/me` when the app loads. A splash screen shows during that check, so protected pages don't flicker.
- The cart is synced from the server. Quantity changes and removals update optimistically and roll back if the server rejects them.
- Payments use Midtrans Snap (sandbox). Checkout creates the order and then opens the Snap popup. After the popup closes, the order page syncs the status from the server.
- Product images load from `/uploads/<file-name>`. A placeholder is shown if the file is missing.

## Verification

- `npm run build` succeeds.
- Lighthouse on the preview build (headless Chrome, default throttling), mobile: accessibility 94 to 100, best practices 96, and SEO 100 on the homepage and catalog. Performance is 74 to 82. The score varies between runs and the hero video drags it down.
