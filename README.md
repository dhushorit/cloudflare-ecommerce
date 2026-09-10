# Serverless Cloudflare E-Commerce Platform

A 100% serverless, edge-native, zero-cost-tier e-commerce architecture running entirely within the Cloudflare ecosystem.

---

## 🏛️ Architecture Overview

| Layer | Technology | Hosting / Binding | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Storefront & Admin** | React 18 + Vite + Tailwind CSS | **Cloudflare Pages** | Static edge delivery, dynamic cart, responsive catalog, checkout & backoffice |
| **Backend API Gateway** | Hono.js | **Cloudflare Workers** | Edge API router, atomic checkout, validation, Web Crypto auth |
| **Relational Database** | SQLite via Drizzle ORM | **Cloudflare D1** (`DB`) | Serverless relational storage for orders, catalog, and admin users |
| **Object Storage** | S3-compatible Blob Storage | **Cloudflare R2** (`BUCKET`) | Product photography and media uploads |
| **Session & Rate-Limiting** | Key-Value Store | **Cloudflare KV** (`KV`) | IP-based sliding window rate-limiting and auth session caching |
| **Alerts & Communications** | Telegram Bot API & Resend | Edge `waitUntil` tasks | Real-time order push notifications & customer confirmation receipts |

---

## 📂 Project Structure

```
cloudflare-ecommerce/
├── apps/
│   ├── web/                     # Cloudflare Pages (React + Vite + Tailwind CSS)
│   │   ├── src/
│   │   │   ├── components/      # Navbar, Hero, ProductCard, CartDrawer, Checkout, Admin, Tracker
│   │   │   ├── context/         # CartContext (localStorage) & AuthContext (JWT)
│   │   │   ├── lib/             # API client with error handling
│   │   │   ├── types/           # Domain TypeScript definitions
│   │   │   ├── App.tsx          # Master UI coordinator
│   │   │   └── main.tsx
│   │   ├── vite.config.ts       # Proxy to Cloudflare Worker during local dev
│   │   └── package.json
│   │
│   └── api/                     # Cloudflare Worker (Hono + Drizzle + D1/R2/KV)
│       ├── drizzle/             # SQLite migrations
│       │   └── 0000_initial.sql
│       ├── src/
│       │   ├── db/
│       │   │   ├── schema.ts    # Complete Drizzle schema (admins, categories, products, orders, items)
│       │   │   └── seed.sql     # Seed data for local & remote databases
│       │   ├── lib/             # Web Crypto PBKDF2, Telegram bot, Resend email, R2 helpers
│       │   ├── middleware/      # KV rate limiter & Admin JWT guard
│       │   ├── routes/          # Storefront, Atomic Checkout, and Admin CRUD routers
│       │   └── index.ts         # Main Worker entrypoint
│       ├── wrangler.toml        # Edge bindings definition
│       └── package.json
│
├── package.json                 # Monorepo workspaces
└── README.md
```

---

## 🚀 Quickstart & Setup Guide

### 1. Provision Cloudflare Resources (One-Time)
Run from the terminal to allocate your lifetime-free Cloudflare resources:
```bash
# 1. Login to your Cloudflare account
npx wrangler login

# 2. Provision the D1 Database
npx wrangler d1 create ecommerce-d1
# -> Copy the generated `database_id` into apps/api/wrangler.toml

# 3. Provision the R2 Bucket for product images
npx wrangler r2 bucket create ecommerce-assets

# 4. Provision the KV Namespace for rate-limiting
npx wrangler kv:namespace create KV
# -> Copy the generated `id` into apps/api/wrangler.toml
```

### 2. Set Production Secrets
```bash
cd apps/api

npx wrangler secret put JWT_SECRET
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put RESEND_API_KEY
```

### 3. Initialize the D1 Database (Migrations & Seed)
```bash
cd apps/api

# Run initial migration locally (Miniflare SQLite)
npm run db:migrate:local

# Seed local database with sample categories, products, and admin
npm run db:seed:local

# (Optional) Run migration on remote Cloudflare D1 production database
npm run db:migrate:remote
npm run db:seed:remote
```

### 4. Run Locally
Run API worker and frontend storefront concurrently:

**Terminal 1 (Backend API Worker):**
```bash
cd apps/api
npm install
npm run dev
# Worker running at http://localhost:8787
```

**Terminal 2 (Frontend UI):**
```bash
cd apps/web
npm install
npm run dev
# Storefront running at http://localhost:5173 (proxied to port 8787 for /api)
```

---

## 🔐 Credentials (Default Local Seed)
- **Admin Email**: `admin@example.com`
- **Admin Password**: `Admin123!`
- **Admin Access Button**: Top-right corner in the Storefront navbar (`Admin`).

---

## 📜 Development History & Changelog
For a comprehensive log of all architectural phases, bug fixes, Bangladesh courier integrations, and verification reports, see **[HISTORY.md](./HISTORY.md)**.

