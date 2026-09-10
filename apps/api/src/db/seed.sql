-- Seed script for Cloudflare D1
-- Note: Timestamps are in epoch milliseconds

-- 1. Insert Initial Superadmin
-- Default admin credentials: admin@example.com / Admin123! (hash generated via standard PBKDF2/WebCrypto)
INSERT OR REPLACE INTO admins (id, name, email, password_hash, role, created_at, updated_at)
VALUES (
  'admin_01h9x3p8m1k5r8t9w2q4n7z1',
  'Store Owner',
  'admin@example.com',
  'pbkdf2:100000:ea6464bd3d3be894a1871b96857dfde9:9310dc67c097df11f6e6d61b71c1d05c9a2f409c113e07fde7fd6e475d864403',
  'superadmin',
  unixepoch() * 1000,
  unixepoch() * 1000
);

-- 2. Insert Sample Categories
INSERT OR IGNORE INTO categories (id, name, slug, description, image_url, display_order, is_active, created_at, updated_at)
VALUES 
(
  'cat_electronics',
  'Electronics & Gadgets',
  'electronics',
  'Smart devices, premium accessories, and audio gear.',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  1,
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
),
(
  'cat_apparel',
  'Premium Apparel',
  'apparel',
  'Minimalist, sustainable, and handcrafted clothing.',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80',
  2,
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
);

-- 3. Insert Sample Products (Prices in Cents: $79.00 -> 7900)
INSERT OR IGNORE INTO products (
  id, category_id, title, slug, sku, description,
  price, compare_at_price, cost_price, stock, images,
  is_featured, is_active, created_at, updated_at
)
VALUES 
(
  'prod_anc_headphones',
  'cat_electronics',
  'Aura Wireless ANC Headphones',
  'aura-wireless-anc-headphones',
  'AUD-AUR-01',
  'Active noise cancelling headphones with 40h battery life and titanium drivers.',
  12900,
  15900,
  6500,
  25,
  '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"]',
  1,
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
),
(
  'prod_mechanical_keyboard',
  'cat_electronics',
  'Chronos 75% Mechanical Keyboard',
  'chronos-75-mechanical-keyboard',
  'KB-CHR-75',
  'Gasket-mounted hot-swappable keyboard with wireless 2.4G and custom linear switches.',
  8900,
  11000,
  4200,
  15,
  '["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80"]',
  1,
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
),
(
  'prod_heavyweight_tee',
  'cat_apparel',
  'Heavyweight Organic Cotton Tee',
  'heavyweight-organic-cotton-tee',
  'APP-TEE-01',
  '300 GSM combed organic cotton with relaxed drop-shoulder silhouette.',
  3500,
  null,
  1200,
  50,
  '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"]',
  0,
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
);
