import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Upload,
  LogOut,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  FolderTree,
  Activity,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Truck,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Product, Order, Category } from "../types";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  categories,
  onRefreshCategories,
}) => {
  const { admin, isAuthenticated, login, logout, isLoading: isAuthLoading } = useAuth();

  // Login form state
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "categories" | "settings">("overview");

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filter States
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  // Modals & Drawers
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", imageUrl: "" });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Diagnostic Test States
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [prodData, orderData] = await Promise.all([
        api.getAdminProducts().catch(() => []),
        api.getAdminOrders().catch(() => []),
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (err: any) {
      console.error("Failed to load admin data", err);
      if (err?.message?.includes("Unauthorized") || err?.message?.includes("Token is invalid")) {
        logout();
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAdminData();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setLoginError(err.message || "Invalid email or password");
    }
  };

  const handleStockDelta = async (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    try {
      await api.saveProduct({ id: productId, stock: newStock });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );
    } catch (err) {
      alert("Failed to update stock");
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err) {
      alert("Failed to update order status");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const publicUrl = await api.uploadMedia(file);
      setEditingProduct((prev) => ({
        ...prev,
        images: [...(prev?.images || []), publicUrl],
      }));
    } catch (err: any) {
      alert(err.message || "Failed to upload image to R2");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title || !editingProduct?.price || !editingProduct?.categoryId) {
      alert("Please fill in required fields (title, category, price)");
      return;
    }

    try {
      const slug =
        editingProduct.slug ||
        editingProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      await api.saveProduct({
        ...editingProduct,
        slug,
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock || 0),
        compareAtPrice: editingProduct.compareAtPrice ? Number(editingProduct.compareAtPrice) : null,
        costPrice: editingProduct.costPrice ? Number(editingProduct.costPrice) : null,
      });

      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      const slug =
        newCategory.slug.trim() ||
        newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      await api.saveCategory({
        ...newCategory,
        slug,
      });
      setIsCategoryModalOpen(false);
      setNewCategory({ name: "", slug: "", description: "", imageUrl: "" });
      onRefreshCategories();
    } catch (err: any) {
      alert(err.message || "Failed to create category");
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramStatus(null);
    try {
      const msg = await api.testTelegram();
      setTelegramStatus(`Success: ${msg}`);
    } catch (err: any) {
      setTelegramStatus(`Error: ${err.message}`);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // KPI Calculations
  const totalRevenue = orders.reduce(
    (sum, o) => (o.status !== "cancelled" ? sum + o.total : sum),
    0
  );
  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  // Filtered Lists
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCategory =
      productCategoryFilter === "all" || p.categoryId === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "all") return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in my-4 min-h-[600px] flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/20">
              CF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                  Edge Commerce Operations Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  D1 SQLite Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cloudflare Workers • Cloudflare R2 Media • KV Cache Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unauthenticated Login Form */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900 text-center">
                Admin Authentication
              </h4>
              <p className="text-xs text-slate-500 text-center mt-1">
                Enter your edge administrator credentials
              </p>

              {loginError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  {isAuthLoading ? "Authenticating..." : "Sign In to Console"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <span className="text-[11px] text-slate-400">
                  Initial Seed: admin@example.com / Admin123!
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Primary Navigation Tabs */}
            <div className="px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 overflow-x-auto">
              <div className="flex gap-2 sm:gap-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "overview"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Overview &amp; Metrics</span>
                </button>

                <button
                  onClick={() => setActiveTab("products")}
                  className={`py-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "products"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Catalog &amp; Stock</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-100 text-[10px] rounded-full">
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`py-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "orders"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Orders &amp; Dispatch</span>
                  {pendingOrdersCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white font-bold text-[10px] rounded-full">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("categories")}
                  className={`py-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "categories"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  <span>Categories</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`py-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "settings"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Edge Health</span>
                </button>
              </div>

              <button
                onClick={loadAdminData}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/60 min-h-0">
              {/* ========================================================== */}
              {/* 1. OVERVIEW & ANALYTICS TAB                                */}
              {/* ========================================================== */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* KPI Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total Revenue
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                        ${(totalRevenue / 100).toFixed(2)}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3.5 h-3.5" /> From atomic orders
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total Orders
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                        {orders.length}
                      </div>
                      <span className="text-[11px] text-indigo-600 font-semibold mt-2 block">
                        {pendingOrdersCount} pending fulfillment
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Low Stock Alerts
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                        {lowStockProducts.length}
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold mt-2 block">
                        Items with ≤ 5 units left
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Active Products
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                        {products.filter((p) => p.isActive).length}
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold mt-2 block">
                        Across {categories.length} categories
                      </span>
                    </div>
                  </div>

                  {/* Operational Widgets Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders Widget */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          Recent Customer Orders
                        </h4>
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          View All Orders &rarr;
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No orders placed yet. Test the storefront checkout to see live records.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 text-xs">
                          {orders.slice(0, 5).map((o) => (
                            <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                              <div>
                                <div className="font-bold text-slate-900">{o.id}</div>
                                <div className="text-[11px] text-slate-500">
                                  {o.customerName} • {o.customerPhone}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">
                                  ${(o.total / 100).toFixed(2)}
                                </div>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    o.status === "delivered"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : o.status === "pending"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {o.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stock Alert Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          Low Stock Warning
                        </h4>
                      </div>

                      {lowStockProducts.length === 0 ? (
                        <div className="py-8 text-center text-xs text-emerald-600 font-semibold">
                          ✓ All products have healthy inventory levels.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 text-xs">
                          {lowStockProducts.map((p) => (
                            <div key={p.id} className="py-2.5 flex items-center justify-between">
                              <div className="truncate pr-2">
                                <div className="font-bold text-slate-900 truncate">{p.title}</div>
                                <div className="text-[10px] text-slate-400">{p.sku || "NO SKU"}</div>
                              </div>
                              <span className="px-2 py-0.5 rounded-md font-bold text-amber-700 bg-amber-100 shrink-0 text-xs">
                                {p.stock} left
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* 2. PRODUCTS & STOCK TAB                                    */}
              {/* ========================================================== */}
              {activeTab === "products" && (
                <div className="space-y-4">
                  {/* Filter & Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
                      <div className="relative w-full">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search product title or SKU..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                        />
                      </div>

                      <select
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setEditingProduct({
                          title: "",
                          slug: "",
                          categoryId: categories[0]?.id || "",
                          price: 0,
                          stock: 10,
                          images: [],
                          isActive: true,
                          isFeatured: false,
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Product</span>
                    </button>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Atomic Stock Adjust</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              No products matched your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/80">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={
                                      p.images?.[0] ||
                                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"
                                    }
                                    alt=""
                                    className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900">{p.title}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {p.sku || "NO SKU"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-slate-600">
                                {p.category?.name || "Uncategorized"}
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                ${(p.price / 100).toFixed(2)}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleStockDelta(p.id, -1)}
                                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs"
                                    title="Decrement Stock"
                                  >
                                    -
                                  </button>
                                  <span className="w-10 text-center font-extrabold text-slate-900">
                                    {p.stock}
                                  </span>
                                  <button
                                    onClick={() => handleStockDelta(p.id, 1)}
                                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs"
                                    title="Increment Stock"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    p.isActive
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {p.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(p);
                                      setIsProductModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* 3. ORDERS & DISPATCH TAB                                   */}
              {/* ========================================================== */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 overflow-x-auto">
                    {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => setOrderStatusFilter(status)}
                          className={`px-3 py-1 text-xs font-bold rounded-xl capitalize whitespace-nowrap transition-colors ${
                            orderStatusFilter === status
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3">Total</th>
                          <th className="p-3">Fulfillment Status</th>
                          <th className="p-3 text-right">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              No orders found matching this filter.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-slate-50/80">
                              <td className="p-3 font-mono font-bold text-slate-900">{o.id}</td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{o.customerName}</div>
                                <div className="text-[11px] text-slate-500">{o.customerPhone}</div>
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-slate-800 uppercase">{o.paymentMethod}</span>
                                {o.paymentTrxId && (
                                  <div className="text-[10px] font-mono text-slate-400">
                                    Trx: {o.paymentTrxId}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                ${(o.total / 100).toFixed(2)}
                              </td>
                              <td className="p-3">
                                <select
                                  value={o.status}
                                  onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                                  className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setSelectedOrder(o)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg font-bold text-xs transition-colors"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* 4. CATEGORIES TAB                                          */}
              {/* ========================================================== */}
              {activeTab === "categories" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
                    <h4 className="font-extrabold text-sm text-slate-900">Storefront Categories</h4>
                    <button
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Category</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.categoryId === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3"
                        >
                          <img
                            src={
                              cat.imageUrl ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"
                            }
                            alt=""
                            className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-slate-900 text-sm truncate">{cat.name}</h5>
                            <span className="text-[11px] text-slate-400 font-mono">slug: {cat.slug}</span>
                            <div className="text-xs font-semibold text-indigo-600 mt-1">
                              {count} product{count === 1 ? "" : "s"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* 5. EDGE HEALTH & SYSTEM SETTINGS TAB                      */}
              {/* ========================================================== */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="font-extrabold text-base text-slate-900">
                      Cloudflare Edge Infrastructure Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Cloudflare D1
                        </div>
                        <div className="text-xs text-slate-600 mt-1 font-mono">ecommerce-d1</div>
                        <span className="text-[10px] text-slate-400">Serverless SQLite</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Cloudflare R2
                        </div>
                        <div className="text-xs text-slate-600 mt-1 font-mono">ecommerce-assets</div>
                        <span className="text-[10px] text-slate-400">Zero egress object storage</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Cloudflare KV
                        </div>
                        <div className="text-xs text-slate-600 mt-1 font-mono">KV Namespace</div>
                        <span className="text-[10px] text-slate-400">Low-latency rate limiter</span>
                      </div>
                    </div>
                  </div>

                  {/* Telegram Notification Test */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="font-extrabold text-base text-slate-900">
                      Telegram Dispatch Bot Pipeline
                    </h4>
                    <p className="text-xs text-slate-500">
                      Trigger a real-time verification ping from Cloudflare Workers to your Telegram Chat ID.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleTestTelegram}
                        disabled={isTestingTelegram}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTestingTelegram ? "Pinging Telegram..." : "Send Test Alert"}</span>
                      </button>
                    </div>

                    {telegramStatus && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono">
                        {telegramStatus}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Details Drawer */}
        {selectedOrder && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Order Inspection</span>
                  <h4 className="font-mono font-extrabold text-slate-900 text-base">{selectedOrder.id}</h4>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">{selectedOrder.customerName}</div>
                  <div className="text-slate-600">Phone: <b>{selectedOrder.customerPhone}</b></div>
                  {selectedOrder.customerEmail && <div className="text-slate-600">Email: {selectedOrder.customerEmail}</div>}
                  <div className="text-slate-600">Address: {selectedOrder.shippingAddress}, {selectedOrder.city}</div>
                  {selectedOrder.notes && <div className="text-slate-500 italic mt-1">Note: {selectedOrder.notes}</div>}
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Payment</span>
                    <div className="font-bold text-slate-900 uppercase">{selectedOrder.paymentMethod}</div>
                    {selectedOrder.paymentTrxId && (
                      <div className="font-mono text-indigo-600 font-bold">Trx: {selectedOrder.paymentTrxId}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                    <div className="font-black text-slate-900 text-sm">${(selectedOrder.total / 100).toFixed(2)}</div>
                  </div>
                </div>

                {/* Purchased Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Purchased Items</span>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="p-2.5 flex justify-between items-center bg-white">
                          <div>
                            <div className="font-bold text-slate-900">{item.productTitle}</div>
                            <div className="text-slate-500">Qty: {item.quantity} • ${(item.unitPrice / 100).toFixed(2)}</div>
                          </div>
                          <div className="font-mono font-bold text-slate-900">${(item.totalPrice / 100).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Update Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleOrderStatusUpdate(selectedOrder.id, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {isProductModalOpen && editingProduct && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-base">
                  {editingProduct.id ? "Edit Product" : "Create New Product"}
                </h4>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                    <select
                      value={editingProduct.categoryId || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={editingProduct.sku || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Price ($ Cents) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 4900 = $49.00"
                      value={editingProduct.price || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setEditingProduct({ ...editingProduct, price: isNaN(val) ? 0 : val });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Compare At</label>
                    <input
                      type="number"
                      value={editingProduct.compareAtPrice ?? ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setEditingProduct({ ...editingProduct, compareAtPrice: isNaN(val) ? null : val });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.stock ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setEditingProduct({ ...editingProduct, stock: isNaN(val) ? 0 : val });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Direct R2 Image Upload */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Images (Upload to Cloudflare R2)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer font-bold text-slate-700 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? "Uploading to R2..." : "Choose Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {editingProduct.images?.length || 0} image(s) attached
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Category Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-sm">Add New Category</h4>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Footwear"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. footwear"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newCategory.imageUrl}
                    onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
