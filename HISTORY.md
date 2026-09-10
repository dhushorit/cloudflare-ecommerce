# 📜 Project History & Development Changelog

## Cloudflare Edge-Native Serverless E-Commerce Platform

This document captures the complete architectural evolution, feature additions, bug fixes, database migrations, and operational workflows implemented in this repository.

---

## 🏛️ Core Architecture Summary

- **Frontend (`apps/web`)**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, deployed to **Cloudflare Pages**.
- **Backend API (`apps/api`)**: **Cloudflare Workers** powered by **Hono.js** framework.
- **Relational Database**: **Cloudflare D1** (Serverless SQLite) with **Drizzle ORM**.
- **Object Storage**: **Cloudflare R2** (S3-compatible bucket) for product images and media uploads.
- **Session & Rate-Limiting**: **Cloudflare KV** namespace for sliding-window rate limiting and session storage.
- **Background Jobs / Notifications**: Edge `waitUntil` non-blocking execution for **Telegram Bot API** alerts and **Resend** transactional emails.
- **Logistics & Dispatch**: 1-Click Bangladesh Courier Integration (Steadfast, RedX, Pathao, Paperfly, eCourier, Sundarban, SA Paribahan, Manual).

---

## 📅 Chronological Development History

### Phase 1: Foundation & Cloudflare Edge Stack Initialization
- Created monorepo structure with `apps/api` and `apps/web`.
- Initialized Cloudflare Workers configuration in `apps/api/wrangler.toml` with bindings for:
  - `DB`: D1 database `ecommerce-d1`
  - `BUCKET`: R2 bucket `ecommerce-assets`
  - `KV`: KV namespace for rate-limiting and auth tokens
  - Environment variables for Telegram, Resend, and JWT secrets.
- Configured Drizzle ORM schema (`apps/api/src/db/schema.ts`):
  - `admins`: Edge auth with Web Crypto PBKDF2 password hashing.
  - `categories`: Product categorization with slugs and image URLs.
  - `products`: Catalog items with pricing (in cents/paisa), SKU, stock quantity, and featured flags.
  - `orders`: Master order records, shipping addresses, payment methods, transaction IDs, and courier details.
  - `order_items`: Order line items with unit prices and total values.
- Applied initial migration `0000_initial.sql` and seeded initial catalog data (`seed.sql`).

### Phase 2: Storefront UI & Cart Checkout Flow (`apps/web`)
- Implemented modern, glassmorphic storefront:
  - **Navbar**: Live category navigation, search bar, cart drawer counter, admin gateway button.
  - **Hero Section**: Responsive promotional banners with CTA buttons.
  - **Product Grid**: Dynamic product cards with hover animations, stock badges, and 1-click cart addition.
  - **Product Modal**: Detailed product view with full description and image showcase.
  - **Cart Drawer**: Sliding slide-out cart with quantity controls, subtotal computation, and free delivery progress bar.
  - **Checkout Modal**:
    - Customer information capture (Name, Phone, Email, Shipping Address, City/District).
    - Payment options: **Cash on Delivery (COD)**, **bKash**, **Nagad**, **Rocket**, and **Bank Transfer**.
    - For mobile financial services (bKash/Nagad), displays merchant receiver numbers and collects customer's transaction ID (TrxID).
    - Direct integration with backend `POST /api/checkout` with atomic inventory deduction.
  - **Order Tracker Drawer**: Order lookup by Order ID and Phone number displaying live fulfillment timeline.

### Phase 3: Notifications & Edge Background Tasks
- Integrated storeowner alerts via Telegram Bot API in `apps/api/src/lib/notifications.ts`.
- Integrated customer confirmation emails via Resend API.
- Implemented edge-native `c.executionCtx.waitUntil(...)` to run notification dispatching asynchronously so customer checkout response times remain under 50ms.

### Phase 4: Admin Portal Transformation (Popup to Full Enterprise Backoffice)
- **Problem**: Admin interface originally opened as a cramped popup modal and suffered from a white-screen crash due to React hook call ordering.
- **Solution**:
  - Replaced the modal with a standalone, full-screen portal component: [`apps/web/src/components/AdminPortal.tsx`](file:///d:/cloudflare-ecommerce/apps/web/src/components/AdminPortal.tsx) accessible via `#admin` and the top navigation bar.
  - Fixed React Rules of Hooks bug by moving conditional authentication checks after all React hooks.
  - Fixed Hono v4 JWT verification crash by supplying explicit algorithm `"HS256"`.
- **Admin Portal Features**:
  1. **Overview & KPI Dashboard**:
     - Metric cards: Total Revenue, Total Orders, Active Catalog Count, Registered Customers.
     - Live orders status breakdown (Pending, Processing, Shipped, Delivered, Cancelled).
     - Inventory Health & Low Stock Urgency alerts.
     - Stream of recent storefront orders.
  2. **Products & Inventory Control**:
     - Real-time search and category filtering.
     - Quick inline stock adjustments (+1 / -1 buttons) that persist immediately to Cloudflare D1.
     - Product Create/Edit dialog with direct media file upload to Cloudflare R2 bucket.
     - Catalog deletion with confirmation.
  3. **Orders & Fulfillment Management**:
     - Status filtering tabs with order count indicators.
     - Order inspection drawer with full customer info, line items, and fulfillment history.
     - Fulfillment status dropdown updates.
     - Printable packing slip / invoice generation.
     - 1-click CSV order export for offline accounting.
  4. **Customer Directory (CRM)**:
     - Aggregated customer profiles derived from order history.
     - Customer lifetime spend and order count tracking.
  5. **Categories Management**:
     - Create new product categories with automatic slug generation.
  6. **Coupons & Promotional Codes**:
     - Manage discount codes and percentage reductions.
  7. **Store Settings & Edge Diagnostics**:
     - Store name, currency, and bKash/Nagad merchant payment numbers.
     - Diagnostics card confirming Cloudflare D1, R2, and KV connectivity.

### Phase 5: Bangladesh All-Courier Dispatch Engine Integration
- **Objective**: Allow the store merchant to dispatch orders to all major Bangladesh courier services directly from the admin panel with a single click.
- **Backend Implementation (`apps/api/src/lib/courier.ts` & `apps/api/src/routes/admin.ts`)**:
  - Endpoint `POST /api/admin/orders/:id/courier` receives provider and parcel instructions.
  - Multi-courier booking engine supporting:
    - **Steadfast Courier**: Direct POST to `https://portal.steadfast.com.bd/api/v1/create_order` using `Api-Key` and `Secret-Key`.
    - **RedX Delivery**: Direct POST to `https://openapi.redx.com.bd/v1.0.0/parcels` with Bearer token.
    - **Pathao Courier**: Direct POST to `https://api-hermes.pathao.com/aladdin/api/v1/orders` with OAuth token and Store ID.
    - **Paperfly Courier**: Nationwide parcel booking with consignment tracking.
    - **eCourier**: Express parcel booking with tracking URL.
    - **Sundarban Courier**: Condition parcel booking.
    - **SA Paribahan**: Branch-to-branch parcel booking.
    - **Manual / Custom Courier**: Fallback for local delivery riders.
  - Intelligent Cash on Delivery (COD) handling:
    - Sets COD collection amount to order total if payment method is `cod`.
    - Automatically sets COD to **৳0 (Pre-paid)** if customer already paid via bKash/Nagad/Rocket.
  - Updates Cloudflare D1 `orders` table:
    - Sets `courierName`, `courierConsignmentId`, `courierTrackingUrl`.
    - Updates order status to `shipped`.
- **Frontend Implementation (`apps/web/src/components/AdminPortal.tsx`)**:
  - Added dedicated **"বাংলাদেশ কুরিয়ার পার্সেল বুকিং"** modal.
  - Shows customer delivery details and verifies verified D1 records.
  - Grid selector for all 8 courier services.
  - Shows live credential status indicator (informs whether live API or sandbox tracking will be generated).
  - Displays instant success confirmation with copyable tracking ID and direct link to live tracking page.
  - Orders table displays an interactive tracking badge `[🚚 Steadfast: ST-xxxx]` with an external link icon.
  - Added Courier Credentials settings card in the Settings tab to persist API keys locally.

---

## 🛠️ Key Bug Fixes & Technical Decisions

| Bug / Challenge | Root Cause | Solution |
| :--- | :--- | :--- |
| **White screen on Admin Login** | In `AdminDashboard.tsx`, `if (!isOpen) return null;` was placed before `useEffect`, violating React Rules of Hooks. | Migrated to standalone `AdminPortal.tsx` and placed all hooks strictly before any conditional return. |
| **Hono JWT Algorithm Error** | Hono v4 `verify(token, secret)` threw `JwtAlgorithmRequired: JWT verification requires "alg" option to be specified`. | Added explicit `"HS256"` argument to `sign()` and `verify()` across auth middleware and admin routes. |
| **D1 Schema Alignment** | Added `courier_name`, `courier_consignment_id`, `courier_tracking_url` columns to D1 schema. | Executed local `ALTER TABLE orders ADD COLUMN ...` migrations on local SQLite D1. |
| **Missing Icon Imports** | `ExternalLink` and `Copy` used in courier badges were missing from `lucide-react` import. | Imported `ExternalLink` and `Copy` in `AdminPortal.tsx`. |
| **TypeScript Strictness** | API payload types had missing optional attributes for notifications and unknown JSON response types. | Added explicit type annotations and nullish coalescing operators to pass `tsc --noEmit` with 0 errors. |

---

## 🧪 Verification & Testing Status

- **Frontend Build (`apps/web`)**: Passed with zero warnings (`tsc && vite build` &rarr; 276 kB bundle).
- **Backend Type Check (`apps/api`)**: Passed with zero errors (`npx tsc --noEmit`).
- **End-to-End Browser Flow**:
  - Customer checkout placed on storefront (`http://localhost:5173`).
  - Order received in Cloudflare D1 database.
  - Admin logged in via `#admin` with `admin@example.com` / `Admin123!`.
  - Clicked "কুরিয়ারে পাঠান" on Order `ORD-20260909-0805A2`.
  - Booked via Steadfast Courier with tracking ID `ST-346236`.
  - Order status changed to `shipped` and live tracking badge displayed in table.

---

## 🚀 Future Roadmap & Next Steps

1. **Production Deployment**:
   - Run `npx wrangler d1 create ecommerce-d1` in Cloudflare dashboard.
   - Run `npx wrangler r2 bucket create ecommerce-assets`.
   - Run `npx wrangler deploy` in `apps/api`.
   - Deploy `apps/web` to Cloudflare Pages via GitHub integration or `npx wrangler pages deploy dist`.
2. **Customer SMS Notifications**:
   - Integrate Greenweb or BulkSMS BD to send SMS to customers with their courier consignment tracking ID upon dispatch.
3. **Automated Webhook Tracking Sync**:
   - Add webhook endpoints for Steadfast and RedX to automatically mark orders as `delivered` or `returned` when the delivery agent completes the drop-off.
