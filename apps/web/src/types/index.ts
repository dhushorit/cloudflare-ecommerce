export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  sku: string | null;
  description: string | null;
  price: number; // in cents
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  category?: Category;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productSku: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  city: string;
  notes: string | null;
  paymentMethod: "cod" | "bkash" | "nagad" | "rocket" | "bank_transfer";
  paymentStatus: "pending" | "verified" | "failed" | "refunded";
  paymentTrxId: string | null;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  courierName?: string | null;
  courierConsignmentId?: string | null;
  courierTrackingUrl?: string | null;
  createdAt: number;
  items?: OrderItem[];
}

export interface Customer {
  name: string;
  phone: string;
  email: string | null;
  city: string;
  totalOrders: number;
  lifetimeValue: number;
  lastOrderDate: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // e.g. 10 (%) or 500 ($5.00)
  minSpend: number;
  usageCount: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  contactPhone: string;
  contactEmail: string;
  currencySymbol: string;
  insideCityShipping: number; // in cents
  outsideCityShipping: number; // in cents
  freeShippingThreshold: number; // in cents
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "manager";
}
