# AuraStore — Enterprise Serverless Cloudflare E-Commerce Platform

A 100% serverless, edge-native, enterprise-grade e-commerce architecture running entirely within the Cloudflare ecosystem (Pages, Workers, D1 SQLite, R2 Object Storage, and KV Cache).

[![Repository](https://img.shields.io/badge/GitHub-Public_Repo-blue?style=flat-square&logo=github)](https://github.com/dhushorit/cloudflare-ecommerce)
[![Architecture](https://img.shields.io/badge/Architecture-Cloudflare_Serverless_Edge-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React_18_+_Vite_+_Tailwind-61DAFB?style=flat-square&logo=react)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-Hono.js_on_Workers-E36002?style=flat-square&logo=hono)](https://hono.dev/)
[![Database](https://img.shields.io/badge/Database-Cloudflare_D1_(SQLite)-003B57?style=flat-square&logo=sqlite)](https://developers.cloudflare.com/d1/)

---

## 🏛️ Architecture Overview

| Layer | Technology | Hosting / Binding | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Storefront & Admin** | React 18 + Vite + Tailwind CSS | **Cloudflare Pages** | Enterprise-grade UI, dynamic cart, responsive catalog, checkout & backoffice |
| **Backend API Gateway** | Hono.js | **Cloudflare Workers** | Edge API router, atomic checkout, validation, Web Crypto auth |
| **Relational Database** | SQLite via Drizzle ORM | **Cloudflare D1** (`DB`) | Serverless relational storage for orders, catalog, and admin users |
| **Object Storage** | S3-compatible Blob Storage | **Cloudflare R2** (`BUCKET`) | Product photography and media uploads |
| **Session & Rate-Limiting** | Key-Value Store | **Cloudflare KV** (`KV`) | IP-based sliding window rate-limiting and auth session caching |
| **Alerts & Communications** | Telegram Bot API & Resend | Edge `waitUntil` tasks | Real-time order push notifications & customer confirmation receipts |

---

## 🎨 Enterprise Design System & UX Standards

The storefront is engineered to match modern world-class design systems (Linear, Apple, Vercel, Stripe):

- **Calibrated Typography Scale**:
  - Primary UI: **Plus Jakarta Sans** & **Inter** with optical sizing and anti-aliasing.
  - Tabular Numbers: `tabular-nums` (`font-variant-numeric: tabular-nums`) applied across all currency prices, quantity counters, and calculations.
  - Monospace Elements: **JetBrains Mono** for SKUs, order reference codes, and technical badges.
- **Glassmorphism & Depth Tokens**:
  - Multi-layer frosted glass panels (`glass-header`, `glass-card`) with backdrop blur (`blur-16px`).
  - Ambient mesh lighting (`hero-glow`) and technical subtle grid overlay.
  - Multi-stop shadows (`shadow-card`, `shadow-card-hover`, `shadow-modal`, `shadow-glow`).
- **Senior UX & Interactive Micro-Animations**:
  - **Live Edge Ticker**: Navbar announcement bar with real-time edge network status indicator.
  - **Quick Search**: Search bar with keyboard shortcut cues (`/` or `Ctrl + K`) and instant auto-focus.
  - **Product Card**: 1:1 square media frame, hover zoom, discount percentages (`-18% OFF`), star rating social proof (★ 4.9), and instant feedback checkmarks on add-to-cart.
  - **Product Detail Modal**: High-res image gallery with thumbnails, tabs (Overview, Delivery & COD, Warranty), stock limit protections, and one-click "Buy Now" flow.
  - **Smart Cart Drawer**: Live $100 free shipping progress meter, quantity steppers, price breakdowns, and SSL/COD trust badges.
  - **Enterprise Footer**: Status indicators for 300+ Edge PoPs, quick category shortcuts, and local payment badges (Cash on Delivery, bKash, Nagad, Rocket).

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
│   │   │   ├── App.tsx          # Master UI coordinator & catalog
│   │   │   ├── index.css        # Enterprise tokens, glass surfaces & typography
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

## 📝 Commit Convention Standard
All commits to this repository follow the **Conventional Commits** standard with detailed descriptive summaries:
- `feat(...)`: New features or UI components
- `fix(...)`: Bug fixes and error resolutions
- `docs(...)`: Documentation and README updates
- `style(...)`: Formatting, styling, and design system refinements
- `refactor(...)`: Code refactoring without behavioral alterations
- `perf(...)`: Performance and latency optimizations

---

## 📜 Development History & Changelog
For a comprehensive log of all architectural phases, bug fixes, Bangladesh courier integrations, and verification reports, see **[HISTORY.md](./HISTORY.md)**.
