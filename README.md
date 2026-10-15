# BakeHouse

An online artisan bakery with an admin dashboard. It is a monorepo with two parts: `server/` (Express + MongoDB) and `client/` (Vite + React).

## Features

| Area | What's included |
| --- | --- |
| Landing | Hero video with a poster image, an announcement bar above the navbar, an admin-managed promo banner carousel, "On Sale", "Fresh from the Oven", a section on where the breads come from, and "How to Order". |
| Products | Catalog with search, filters (category, origin, promo), and sorting, including biggest discount. Product pages show images, discounted price, stock, and reviews. |
| Authentication | Sign up and log in with email and password, or with Google Sign-In. Sessions live in an httpOnly cookie. Two roles: `customer` and `admin`. |
| User Profile | Edit name and phone number, change password (not available for Google accounts), manage shipping addresses, and view order history and reviews. |
| Cart | Stored on the server, so it follows the user across devices. Quantity changes and removals update optimistically. Stock is re-checked on every change. |
| Checkout & Payment | Check out from the cart or straight from "Buy Now". Payment goes through Midtrans Snap (sandbox). Orders have a 24-hour payment window. When Midtrans reports an expiry, the order is cancelled and its stock is restored. |
| Admin Dashboard | Analytics for the last 7, 30, or 90 days: KPIs compared with the previous period, revenue per day, top-selling products, revenue by category, payment conversion, and low stock. |
| All Orders | List of every order, filterable by status and searchable by order number. Order details include status history. Only transitions allowed by the order flow can be applied. |
| All Products | Add, edit, and deactivate products. Upload multiple photos. Edit stock directly in the table. Set discounts with start and end dates. |
| Categories and reviews | Manage categories. Only buyers with a completed order can leave a review, and admins can hide reviews. |
| Store settings | Announcement and promo banners (with image upload). Featured categories can be configured but aren't used on the homepage yet. |

## Tech stack

- Server: Node.js, Express 4, Mongoose 8 (MongoDB Atlas), JWT in an httpOnly cookie, express-validator, multer, midtrans-client, Jest, Supertest, mongodb-memory-server.
- Client: Vite 8, React 19, React Router 7, Zustand, Axios, Tailwind CSS 4, recharts, lucide-react, react-hot-toast, @react-oauth/google.

## Project structure

```
bakehouse/
  server/   API, models, seed script, tests
  client/   web app (storefront and admin)
```

## Requirements

- Node.js 20.19+ or 22.12+
- A MongoDB Atlas cluster, or any MongoDB deployment with a replica set (checkout uses transactions)
- A Midtrans sandbox account (for payments)
- Optional: a Google Cloud client ID (for Google Sign-In)

## Setup

```bash
# 1. Server
cd server
cp .env.example .env        # fill in the values described below
npm install
npm run seed                # empty databases only, see the note below
npm run dev                 # http://localhost:5000

# 2. Client (in another terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to the server, so the session cookie stays on the same origin during development.

Seed note: `npm run seed` refuses to run on a database that already has data. To start over, run `npm run seed:destroy` and then `npm run seed`. The destroy command deletes all BakeHouse data, including accounts and orders.

## Scripts

| Location | Command | What it does |
| --- | --- | --- |
| `server` | `npm run dev` | Runs the server with nodemon on port 5000 |
| `server` | `npm start` | Runs the server without nodemon |
| `server` | `npm run seed` | Fills an empty database with an admin, demo customers, categories, products, and sample orders and reviews |
| `server` | `npm run seed:destroy` | Deletes all BakeHouse data |
| `server` | `npm test` | Runs the full test suite (in-memory MongoDB) |
| `client` | `npm run dev` | Vite dev server on port 5173 |
| `client` | `npm run build` | Production build into `client/dist` |
| `client` | `npm run preview` | Serves the build on port 4173 |

## Environment variables

### `server/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas connection string, with a replica set |
| `JWT_SECRET` | Yes | At least 32 characters |
| `MIDTRANS_SERVER_KEY` | Yes | Sandbox server key (`SB-Mid-server-...`) |
| `MIDTRANS_CLIENT_KEY` | Yes | Sandbox client key (`SB-Mid-client-...`) |
| `MIDTRANS_IS_PRODUCTION` | No | `false` (default) for sandbox |
| `PORT` | No | Defaults to 5000 |
| `CLIENT_URL` | No | Frontend origin, used for CORS and Midtrans return links. Defaults to `http://localhost:5173` |
| `JWT_EXPIRES_IN` | No | Defaults to `7d` |
| `COOKIE_SAME_SITE` | No | `lax` (development) or `none` (production, requires HTTPS) |
| `GOOGLE_CLIENT_ID` | No | If empty, Google Sign-In is disabled |
| `AUTH_RATE_LIMIT_MAX` | No | Maximum auth attempts per IP per 15 minutes |
| `SHIPPING_FEE` | No | Shipping fee in rupiah |
| `FREE_SHIPPING_THRESHOLD` | No | Minimum subtotal for free shipping |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | For seeding | Admin account credentials |
| `SEED_CUSTOMER_PASSWORD` | For seeding | Password for the demo customers |

### `client/.env`

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Defaults to `/api`. Leave it as is during development. |
| `VITE_GOOGLE_CLIENT_ID` | If empty, the Google button is hidden |
| `VITE_MIDTRANS_CLIENT_KEY` | Must match `MIDTRANS_CLIENT_KEY` on the server |
| `VITE_MIDTRANS_IS_PRODUCTION` | `false` for sandbox |

## Payment (Midtrans sandbox)

Payments use Midtrans Snap in sandbox mode, so no real money moves.

### 1. Keys

Get the sandbox server key and client key from the Midtrans dashboard under Settings, then Access Keys. Put `MIDTRANS_SERVER_KEY` and `MIDTRANS_CLIENT_KEY` in `server/.env`, and `VITE_MIDTRANS_CLIENT_KEY` in `client/.env`. The server won't start without both server-side keys.

### 2. Webhook (optional in development)

Midtrans sends payment status updates to the server through a webhook. A webhook needs a public address, so on a local machine use ngrok:

```bash
ngrok http 5000
```

In the Midtrans dashboard, go to Settings, then Configuration, and set **Payment Notification URL** to:

```
https://<ngrok-subdomain>.ngrok-free.app/api/payments/midtrans/notification
```

Without the webhook, order status still gets updated. The order page checks the status with Midtrans when it opens and after the payment popup closes.

### 3. Trying a payment

- Pick bank transfer in Snap, then open the Midtrans sandbox simulator and complete the payment there.
- For credit cards, use a test card from the Midtrans docs. Sandbox test cards and OTP codes change from time to time, so check the current documentation.
- The 24-hour payment window starts when the order is created. An order is cancelled and its stock restored when Midtrans reports an expiry, or when its status is checked from the order page. There is no scheduled job, so an order that is never checked can stay pending and keep holding stock.

### 4. Notes

- Cancelling a paid order only marks it as "Refunded". No money is sent back, so the refund has to be done manually in the Midtrans dashboard.
- If a payment arrives after the order was cancelled, the server only logs a warning. The order is not reactivated, and the refund has to be done manually.

## Demo accounts

After `npm run seed`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` |
| Customer | `rina@example.com`, `budi@example.com`, `dewi@example.com`, `andi@example.com`, `sari@example.com`, `yoga@example.com` | `SEED_CUSTOMER_PASSWORD` |

Admins go straight to `/admin` after logging in. Customers return to the homepage or to the page they were on.

## Tests

```bash
cd server
npm test
```

Tests run against an in-memory MongoDB. The first run downloads a MongoDB binary (about 800 MB). Set `MONGOMS_DOWNLOAD_DIR` to choose where it goes, and point `TEMP` at another drive if you want the temporary files elsewhere. The tests write temporary upload files and clean them up afterwards.

Coverage: auth, products, cart, checkout, payments (signature verification, status mapping, idempotency, Snap failures), Buy Now, discounts, reviews, profile and settings, analytics, and uploads.

## Out of scope

- Courier shipping and tracking. Shipping cost is a simple calculation based on subtotal.
- Email (order confirmations, password reset).
- Automatic refunds. Refunds are manual.
- A scheduled job for orders that expire without a notification.
- Featured categories on the homepage.
- A stock filter in the catalog.
- Multi-currency and tax.
- Multi-warehouse stock management.
