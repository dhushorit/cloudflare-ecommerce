import type { Category, Product, Order, AdminUser } from "../types";

const API_BASE = "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // --------------------------------------------------------------------------
  // Storefront Public Endpoints
  // --------------------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    const json = await res.json();
    return json.data;
  },

  async getProducts(params?: { category?: string; q?: string; page?: number }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.q) query.set("q", params.q);
    if (params?.page) query.set("page", params.page.toString());

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const json = await res.json();
    return json.data;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${slug}`);
    if (!res.ok) throw new Error("Product not found");
    const json = await res.json();
    return json.data;
  },

  async trackOrder(orderId: string, phone: string): Promise<Order> {
    const res = await fetch(
      `${API_BASE}/orders/track?orderId=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Order not found");
    }
    const json = await res.json();
    return json.data;
  },

  async checkout(payload: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: string;
    city: string;
    notes?: string;
    paymentMethod: string;
    paymentTrxId?: string;
    items: Array<{ productId: string; quantity: number }>;
  }): Promise<{ success: boolean; order: { id: string; total: number } }> {
    const res = await fetch(`${API_BASE}/checkout/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error || "Checkout failed");
    }
    return json;
  },

  // --------------------------------------------------------------------------
  // Admin Endpoints
  // --------------------------------------------------------------------------
  async adminLogin(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Invalid email or password");
    }
    return json;
  },

  async getAdminProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/admin/products`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch admin products");
    const json = await res.json();
    return json.data;
  },

  async saveProduct(product: Partial<Product> & { id?: string }): Promise<void> {
    const isEdit = !!product.id;
    const url = isEdit ? `${API_BASE}/admin/products/${product.id}` : `${API_BASE}/admin/products`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(product),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to save product");
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete product");
  },

  async getAdminOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch admin orders");
    const json = await res.json();
    return json.data;
  },

  async updateOrderStatus(
    orderId: string,
    updates: { status?: string; paymentStatus?: string }
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update order status");
  },

  async uploadMedia(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload image to R2");
    }

    const json = await res.json();
    return json.url;
  },

  async saveCategory(category: { name: string; slug: string; description?: string; imageUrl?: string }): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(category),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create category");
    }
  },

  async testTelegram(): Promise<string> {
    const res = await fetch(`${API_BASE}/admin/test-telegram`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error || "Failed to trigger Telegram test");
    }
    return json.message;
  },

  async dispatchToCourier(
    orderId: string,
    payload: {
      provider: "steadfast" | "redx" | "pathao" | "paperfly" | "ecourier" | "sundarban" | "sa_paribahan" | "manual";
      note?: string;
      credentials?: { apiKey?: string; secretKey?: string; token?: string; storeId?: string };
    }
  ): Promise<{ success: boolean; result: any; updatedOrder: any }> {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/courier`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error || "Failed to dispatch order to courier");
    }
    return json;
  },
};
