import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  Tag,
  Settings,
  Activity,
  LogOut,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Upload,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Send,
  Download,
  CheckCircle2,
  Printer,
  Search,
  Check,
  Eye,
  ArrowLeft,
  X,
  CreditCard,
  Truck,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Product, Order, Category, Customer, Coupon, StoreSettings } from "../types";

interface AdminPortalProps {
  onBackToStore: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onBackToStore,
  categories,
  onRefreshCategories,
}) => {
  const { admin, isAuthenticated, login, logout, isLoading: isAuthLoading } = useAuth();

  // Authentication form state
  const [loginEmail, setLoginEmail] = useState("admin@example.com");
  const [loginPassword, setLoginPassword] = useState("Admin123!");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Navigation
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "products" | "orders" | "customers" | "categories" | "coupons" | "settings"
  >("dashboard");

  // Domain Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Product Filter & Modals
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Order Filters & Inspection Drawer
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Bangladesh Courier Dispatch Engine State
  const [bookingOrder, setBookingOrder] = useState<Order | null>(null);
  const [courierProvider, setCourierProvider] = useState<
    "steadfast" | "redx" | "pathao" | "paperfly" | "ecourier" | "sundarban" | "sa_paribahan" | "manual"
  >("steadfast");
  const [courierNote, setCourierNote] = useState("");
  const [isBookingCourier, setIsBookingCourier] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    consignmentId: string;
    trackingUrl: string;
    message: string;
  } | null>(null);

  // Courier API Credentials (stored locally in browser or synced)
  const [courierSettings, setCourierSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("courier_settings");
      return saved
        ? JSON.parse(saved)
        : {
            steadfastApiKey: "",
            steadfastSecretKey: "",
            redxToken: "",
            pathaoToken: "",
            pathaoStoreId: "",
          };
    } catch {
      return {
        steadfastApiKey: "",
        steadfastSecretKey: "",
        redxToken: "",
        pathaoToken: "",
        pathaoStoreId: "",
      };
    }
  });

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", imageUrl: "" });

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: "cpn_1",
      code: "WELCOME10",
      discountType: "percentage",
      discountValue: 10,
      minSpend: 2000,
      usageCount: 14,
      isActive: true,
    },
    {
      id: "cpn_2",
      code: "FREESHIP",
      discountType: "fixed",
      discountValue: 500,
      minSpend: 5000,
      usageCount: 28,
      isActive: true,
    },
  ]);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">("percentage");

  // Store Settings State
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "AuraStore Edge Commerce",
    contactPhone: "+1 (800) 555-0199",
    contactEmail: "support@aurastore.com",
    currencySymbol: "$",
    insideCityShipping: 300,
    outsideCityShipping: 500,
    freeShippingThreshold: 10000,
    bkashNumber: "01700-112233",
    nagadNumber: "01800-445566",
    rocketNumber: "01900-778899",
  });
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Diagnostic Test
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
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

  const handleDispatchCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingOrder) return;
    setIsBookingCourier(true);
    setBookingResult(null);
    try {
      const credentials = {
        apiKey: courierSettings.steadfastApiKey,
        secretKey: courierSettings.steadfastSecretKey,
        token: courierProvider === "redx" ? courierSettings.redxToken : courierSettings.pathaoToken,
        storeId: courierSettings.pathaoStoreId,
      };

      const res = await api.dispatchToCourier(bookingOrder.id, {
        provider: courierProvider,
        note: courierNote,
        credentials,
      });

      setBookingResult({
        consignmentId: res.result.consignmentId,
        trackingUrl: res.result.trackingUrl,
        message: res.result.message,
      });

      // Update order in state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === bookingOrder.id
            ? {
                ...o,
                courierName: res.result.provider,
                courierConsignmentId: res.result.consignmentId,
                courierTrackingUrl: res.result.trackingUrl,
                status: "shipped",
              }
            : o
        )
      );

      if (selectedOrder?.id === bookingOrder.id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                courierName: res.result.provider,
                courierConsignmentId: res.result.consignmentId,
                courierTrackingUrl: res.result.trackingUrl,
                status: "shipped",
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to dispatch courier consignment");
    } finally {
      setIsBookingCourier(false);
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
      loadData();
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

      await api.saveCategory({ ...newCategory, slug });
      setIsCategoryModalOpen(false);
      setNewCategory({ name: "", slug: "", description: "", imageUrl: "" });
      onRefreshCategories();
    } catch (err: any) {
      alert(err.message || "Failed to create category");
    }
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    setCoupons((prev) => [
      ...prev,
      {
        id: `cpn_${Date.now()}`,
        code: newCouponCode.trim().toUpperCase(),
        discountType: newCouponType,
        discountValue: Number(newCouponValue),
        minSpend: 0,
        usageCount: 0,
        isActive: true,
      },
    ]);
    setNewCouponCode("");
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

  // CSV Exporters
  const exportProductsCSV = () => {
    const headers = "ID,Title,SKU,Category,Price_USD,Stock,Status\n";
    const rows = products
      .map(
        (p) =>
          `"${p.id}","${p.title}","${p.sku || ""}","${p.category?.name || ""}","$${(
            p.price / 100
          ).toFixed(2)}",${p.stock},"${p.isActive ? "Active" : "Inactive"}"`
      )
      .join("\n");
    downloadBlob(headers + rows, "products-export.csv");
  };

  const exportOrdersCSV = () => {
    const headers = "Order_ID,Customer_Name,Phone,Payment_Method,Trx_ID,Total_USD,Status\n";
    const rows = orders
      .map(
        (o) =>
          `"${o.id}","${o.customerName}","${o.customerPhone}","${o.paymentMethod}","${
            o.paymentTrxId || ""
          }","$${(o.total / 100).toFixed(2)}","${o.status}"`
      )
      .join("\n");
    downloadBlob(headers + rows, "orders-export.csv");
  };

  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Calculations
  const totalRevenue = orders.reduce((sum, o) => (o.status !== "cancelled" ? sum + o.total : sum), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const processingOrders = orders.filter((o) => o.status === "processing");
  const lowStockItems = products.filter((p) => p.stock <= 5);

  // Derived Customers Directory
  const customersMap = new Map<string, Customer>();
  for (const o of orders) {
    const key = o.customerPhone;
    const existing = customersMap.get(key);
    if (existing) {
      existing.totalOrders += 1;
      existing.lifetimeValue += o.total;
      existing.lastOrderDate = Math.max(existing.lastOrderDate, o.createdAt);
    } else {
      customersMap.set(key, {
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail,
        city: o.city,
        totalOrders: 1,
        lifetimeValue: o.total,
        lastOrderDate: o.createdAt,
      });
    }
  }
  const customersList = Array.from(customersMap.values());

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCat = productCategoryFilter === "all" || p.categoryId === productCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "all") return true;
    return o.status === orderStatusFilter;
  });

  // Login Screen if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 animate-fade-in">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 text-center tracking-tight">
            Aura Admin Console
          </h2>
          <p className="text-xs text-slate-500 text-center mt-1">
            Sign in to manage edge catalog, inventory, and fulfillment
          </p>

          {loginError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center"
            >
              {isAuthLoading ? "Authenticating..." : "Sign In to Backoffice"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onBackToStore}
              className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
            </button>
            <span className="text-[11px] text-slate-400">admin@example.com / Admin123!</span>
          </div>
        </div>
      </div>
    );
  }

  // Full-Page Admin Portal Layout
  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900 font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* Fixed Sidebar Navigation                                            */}
      {/* ------------------------------------------------------------------ */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand Banner */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
              CF
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">AURA Admin</span>
              <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Edge 100% Serverless
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "products"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>Products &amp; Stock</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "orders"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders &amp; Fulfillment</span>
            </div>
            {pendingOrders.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "customers"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Customer Directory</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {customersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "categories"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => setActiveTab("coupons")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "coupons"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promo Coupons</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Settings &amp; Fees</span>
          </button>
        </nav>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={onBackToStore}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Storefront</span>
          </button>

          <div className="flex items-center justify-between pt-2">
            <div className="truncate">
              <span className="block text-xs font-bold text-white truncate">{admin?.name}</span>
              <span className="block text-[10px] text-slate-500 font-mono truncate">{admin?.email}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main Content Viewport                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 capitalize">
              {activeTab === "dashboard" ? "Operations & Analytics Overview" : activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync D1 Data</span>
            </button>
          </div>
        </header>

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ============================================================== */}
          {/* 1. DASHBOARD OVERVIEW TAB                                      */}
          {/* ============================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Metric Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">Gross Revenue</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    ${(totalRevenue / 100).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    100% processed atomically on D1
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Orders</span>
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    {orders.length}
                  </div>
                  <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                    {pendingOrders.length} pending dispatch
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">Low Stock Alerts</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
                    {lowStockItems.length}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                    Products with ≤ 5 units
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">Customers</span>
                    <Users className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    {customersList.length}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                    Unique phone profiles
                  </span>
                </div>
              </div>

              {/* Graphical Trend & Analytics Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Sales Performance Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Fulfillment Pipeline Distribution</h3>
                      <p className="text-xs text-slate-500">Live order breakdown across workflow states</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 py-6 text-center">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <span className="text-xs font-bold text-amber-800 uppercase">Pending</span>
                      <div className="text-2xl font-black text-amber-900 mt-1">{pendingOrders.length}</div>
                    </div>
                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                      <span className="text-xs font-bold text-sky-800 uppercase">Processing</span>
                      <div className="text-2xl font-black text-sky-900 mt-1">{processingOrders.length}</div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <span className="text-xs font-bold text-indigo-800 uppercase">Shipped</span>
                      <div className="text-2xl font-black text-indigo-900 mt-1">
                        {orders.filter((o) => o.status === "shipped").length}
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-xs font-bold text-emerald-800 uppercase">Delivered</span>
                      <div className="text-2xl font-black text-emerald-900 mt-1">
                        {orders.filter((o) => o.status === "delivered").length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stock Urgency Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm mb-1">Inventory Health</h3>
                    <p className="text-xs text-slate-500 mb-4">Immediate restock requirements</p>

                    {lowStockItems.length === 0 ? (
                      <div className="p-4 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-medium">
                        ✓ All catalog items are sufficiently stocked.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {lowStockItems.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl"
                          >
                            <span className="font-bold text-slate-900 truncate pr-2">{item.title}</span>
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-extrabold">
                              {item.stock} left
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab("products")}
                    className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Manage Inventory &rarr;
                  </button>
                </div>
              </div>

              {/* Recent Orders Stream */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-slate-900 text-sm">Recent Storefront Orders</h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View All Orders &rarr;
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No orders recorded yet. Open the storefront to place your first test checkout.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {orders.slice(0, 6).map((o) => (
                      <div key={o.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold text-slate-900">{o.id}</div>
                          <div className="text-[11px] text-slate-500">
                            {o.customerName} • {o.customerPhone} ({o.paymentMethod.toUpperCase()})
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900">${(o.total / 100).toFixed(2)}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. PRODUCTS & STOCK MANAGEMENT TAB                             */}
          {/* ============================================================== */}
          {activeTab === "products" && (
            <div className="space-y-4">
              {/* Product Controls Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-lg">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search title, SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={exportProductsCSV}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

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
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Product &amp; SKU</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Atomic Stock Modifier</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No products found.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  p.images?.[0] ||
                                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"
                                }
                                alt=""
                                className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200"
                              />
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{p.title}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {p.sku || "NO-SKU"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-600">{p.category?.name || "Uncategorized"}</td>
                          <td className="p-3.5 font-bold text-slate-900">${(p.price / 100).toFixed(2)}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStockDelta(p.id, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span className="w-10 text-center font-black text-slate-900 text-xs">
                                {p.stock}
                              </span>
                              <button
                                onClick={() => handleStockDelta(p.id, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5">
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
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                              >
                                <Trash2 className="w-4 h-4" />
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

          {/* ============================================================== */}
          {/* 3. ORDERS & FULFILLMENT TAB                                    */}
          {/* ============================================================== */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setOrderStatusFilter(status)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize whitespace-nowrap transition-colors ${
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

                <button
                  onClick={exportOrdersCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Orders CSV</span>
                </button>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Customer &amp; Phone</th>
                      <th className="p-3.5">Payment Method</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Fulfillment</th>
                      <th className="p-3.5">BD Courier Dispatch</th>
                      <th className="p-3.5 text-right">Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No orders matched this status filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-mono font-bold text-slate-900">{o.id}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{o.customerName}</div>
                            <div className="text-[11px] text-slate-500">{o.customerPhone}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold uppercase text-slate-800">{o.paymentMethod}</span>
                            {o.paymentTrxId && (
                              <div className="text-[10px] font-mono text-indigo-600 font-bold">
                                Trx: {o.paymentTrxId}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 font-black text-slate-900">
                            ${(o.total / 100).toFixed(2)}
                          </td>
                          <td className="p-3.5">
                            <select
                              value={o.status}
                              onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-3.5">
                            {o.courierConsignmentId ? (
                              <a
                                href={o.courierTrackingUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                                title="Track live on Courier Portal"
                              >
                                <Truck className="w-3 h-3 text-emerald-600" />
                                <span>{o.courierName}: {o.courierConsignmentId}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <button
                                onClick={() => {
                                  setBookingOrder(o);
                                  setCourierNote(o.notes || `Order ${o.id}`);
                                  setBookingResult(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>কুরিয়ারে পাঠান</span>
                              </button>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs transition-colors"
                            >
                              Inspect Details
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

          {/* ============================================================== */}
          {/* 4. CUSTOMER DIRECTORY TAB                                      */}
          {/* ============================================================== */}
          {activeTab === "customers" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Customer Profiles</h3>
                  <p className="text-xs text-slate-500">Automatically aggregated from storefront orders</p>
                </div>
                <span className="text-xs font-bold text-slate-600">
                  {customersList.length} Customer Accounts
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Phone &amp; Email</th>
                      <th className="p-3.5">City / Location</th>
                      <th className="p-3.5">Total Orders</th>
                      <th className="p-3.5">Lifetime Value</th>
                      <th className="p-3.5 text-right">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No customer profiles recorded yet.
                        </td>
                      </tr>
                    ) : (
                      customersList.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                          <td className="p-3.5">
                            <div className="font-mono text-slate-900">{c.phone}</div>
                            {c.email && <div className="text-[10px] text-slate-500">{c.email}</div>}
                          </td>
                          <td className="p-3.5 text-slate-600">{c.city}</td>
                          <td className="p-3.5 font-bold text-slate-900">{c.totalOrders} order(s)</td>
                          <td className="p-3.5 font-black text-indigo-600">
                            ${(c.lifetimeValue / 100).toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right text-slate-500">
                            {new Date(c.lastOrderDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. CATEGORIES TAB                                              */}
          {/* ============================================================== */}
          {activeTab === "categories" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Storefront Product Categories</h3>
                  <p className="text-xs text-slate-500">Manage catalog categorization and hierarchy</p>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5"
                    >
                      <img
                        src={
                          cat.imageUrl ||
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"
                        }
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{cat.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">slug: {cat.slug}</span>
                        <div className="text-xs font-bold text-indigo-600 mt-1">
                          {count} item{count === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. COUPONS & DISCOUNTS TAB                                     */}
          {/* ============================================================== */}
          {activeTab === "coupons" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-extrabold text-sm text-slate-900 mb-3">Create Promotional Voucher</h3>
                <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SUMMER25"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Type</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Flat ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Value</label>
                    <input
                      type="number"
                      required
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors"
                    >
                      Save Coupon
                    </button>
                  </div>
                </form>
              </div>

              {/* Coupons List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Promo Code</th>
                      <th className="p-3.5">Discount</th>
                      <th className="p-3.5">Times Redeemed</th>
                      <th className="p-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{c.code}</td>
                        <td className="p-3.5 font-semibold text-emerald-600">
                          {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `$${c.discountValue} FLAT`}
                        </td>
                        <td className="p-3.5 text-slate-600">{c.usageCount} times</td>
                        <td className="p-3.5 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 7. STORE SETTINGS & EDGE DIAGNOSTICS TAB                       */}
          {/* ============================================================== */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Shipping & Payment Rules */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Store &amp; Shipping Rates</h3>
                    <p className="text-xs text-slate-500">Configure delivery charges and merchant numbers</p>
                  </div>
                  {settingsSavedMessage && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Store Name</label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Support Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Standard Delivery Fee ($)</label>
                    <input
                      type="number"
                      value={settings.insideCityShipping / 100}
                      onChange={(e) =>
                        setSettings({ ...settings, insideCityShipping: Math.round(Number(e.target.value) * 100) })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Express Delivery Fee ($)</label>
                    <input
                      type="number"
                      value={settings.outsideCityShipping / 100}
                      onChange={(e) =>
                        setSettings({ ...settings, outsideCityShipping: Math.round(Number(e.target.value) * 100) })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Free Shipping Threshold ($)</label>
                    <input
                      type="number"
                      value={settings.freeShippingThreshold / 100}
                      onChange={(e) =>
                        setSettings({ ...settings, freeShippingThreshold: Math.round(Number(e.target.value) * 100) })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Mobile Banking Accounts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">bKash Merchant/Personal</label>
                    <input
                      type="text"
                      value={settings.bkashNumber}
                      onChange={(e) => setSettings({ ...settings, bkashNumber: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nagad Merchant/Personal</label>
                    <input
                      type="text"
                      value={settings.nagadNumber}
                      onChange={(e) => setSettings({ ...settings, nagadNumber: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rocket Number</label>
                    <input
                      type="text"
                      value={settings.rocketNumber}
                      onChange={(e) => setSettings({ ...settings, rocketNumber: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSettingsSavedMessage(true);
                      setTimeout(() => setSettingsSavedMessage(false), 2500);
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Update Store Settings
                  </button>
                </div>
              </div>

              {/* Bangladesh Courier API Credentials Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>Bangladesh Courier Integration Settings (কুরিয়ার সেটিংস)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enter merchant API credentials for Steadfast, RedX, and Pathao to dispatch parcels automatically.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Steadfast */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>🚚 Steadfast Courier API</span>
                      <span className="text-[10px] text-indigo-600 font-mono">portal.steadfast.com.bd</span>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-0.5">Api-Key</label>
                      <input
                        type="text"
                        placeholder="e.g. st_key_xxxxxxxx"
                        value={courierSettings.steadfastApiKey}
                        onChange={(e) => setCourierSettings({ ...courierSettings, steadfastApiKey: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-0.5">Secret-Key</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        value={courierSettings.steadfastSecretKey}
                        onChange={(e) => setCourierSettings({ ...courierSettings, steadfastSecretKey: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* RedX */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>🔴 RedX Delivery API</span>
                      <span className="text-[10px] text-rose-600 font-mono">openapi.redx.com.bd</span>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-0.5">API Access Token</label>
                      <input
                        type="password"
                        placeholder="Bearer Token"
                        value={courierSettings.redxToken}
                        onChange={(e) => setCourierSettings({ ...courierSettings, redxToken: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Pathao */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 sm:col-span-2">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>🚀 Pathao Courier API</span>
                      <span className="text-[10px] text-slate-500 font-mono">api-hermes.pathao.com</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-0.5">Bearer Token</label>
                        <input
                          type="password"
                          placeholder="Pathao OAuth Token"
                          value={courierSettings.pathaoToken}
                          onChange={(e) => setCourierSettings({ ...courierSettings, pathaoToken: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-0.5">Store ID</label>
                        <input
                          type="text"
                          placeholder="e.g. 12345"
                          value={courierSettings.pathaoStoreId}
                          onChange={(e) => setCourierSettings({ ...courierSettings, pathaoStoreId: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      localStorage.setItem("courier_settings", JSON.stringify(courierSettings));
                      setSettingsSavedMessage(true);
                      setTimeout(() => setSettingsSavedMessage(false), 2000);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Save Courier Credentials
                  </button>
                </div>
              </div>

              {/* Cloudflare Edge Diagnostics */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900">Cloudflare Edge Architecture Status</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Cloudflare D1
                    </div>
                    <div className="mt-1 font-mono text-slate-700">ecommerce-d1</div>
                    <span className="text-[10px] text-slate-400">Serverless SQLite via Drizzle ORM</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Cloudflare R2
                    </div>
                    <div className="mt-1 font-mono text-slate-700">ecommerce-assets</div>
                    <span className="text-[10px] text-slate-400">Direct presigned S3 media storage</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Cloudflare KV
                    </div>
                    <div className="mt-1 font-mono text-slate-700">KV Namespace</div>
                    <span className="text-[10px] text-slate-400">Rate-limiting &amp; Session Caching</span>
                  </div>
                </div>

                {/* Telegram Bot Live Dispatch Tester */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Telegram Bot Notification Tester</span>
                    <span className="text-[11px] text-slate-500">
                      Dispatches a live notification to your store Telegram group via Cloudflare Workers
                    </span>
                  </div>

                  <button
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingTelegram ? "Pinging..." : "Trigger Live Alert"}</span>
                  </button>
                </div>

                {telegramStatus && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700">
                    {telegramStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Order Inspection Modal / Invoice View                               */}
      {/* ------------------------------------------------------------------ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Order Invoice &amp; Fulfillment</span>
                <h4 className="font-mono font-extrabold text-slate-900 text-base">{selectedOrder.id}</h4>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm">{selectedOrder.customerName}</div>
                <div className="text-slate-600">Phone: <b>{selectedOrder.customerPhone}</b></div>
                {selectedOrder.customerEmail && <div className="text-slate-600">Email: {selectedOrder.customerEmail}</div>}
                <div className="text-slate-600">Address: {selectedOrder.shippingAddress}, {selectedOrder.city}</div>
                {selectedOrder.notes && <div className="text-slate-500 italic mt-1">Delivery Notes: {selectedOrder.notes}</div>}
              </div>

              <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Payment Channel</span>
                  <div className="font-bold text-slate-900 uppercase">{selectedOrder.paymentMethod}</div>
                  {selectedOrder.paymentTrxId && (
                    <div className="font-mono text-indigo-600 font-bold">TrxID: {selectedOrder.paymentTrxId}</div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Order Total</span>
                  <div className="font-black text-slate-900 text-base">${(selectedOrder.total / 100).toFixed(2)}</div>
                </div>
              </div>

              {/* Line Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Purchased Items</span>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-3 flex justify-between items-center bg-white">
                        <div>
                          <div className="font-bold text-slate-900">{item.productTitle}</div>
                          <div className="text-slate-500">Qty: {item.quantity} × ${(item.unitPrice / 100).toFixed(2)}</div>
                        </div>
                        <div className="font-mono font-bold text-slate-900">${(item.totalPrice / 100).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Fulfillment Status</label>
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

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Packing Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Bangladesh Courier Booking & Dispatch Modal                        */}
      {/* ------------------------------------------------------------------ */}
      {bookingOrder && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    বাংলাদেশ কুরিয়ার পার্সেল বুকিং
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Order #{bookingOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBookingOrder(null);
                  setBookingResult(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingResult ? (
              /* Success Result View */
              <div className="mt-5 space-y-4 text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-base">
                    কুরিয়ার কনসাইনমেন্ট সফলভাবে বুক হয়েছে!
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">
                    {bookingResult.message}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">কুরিয়ার প্রোভাইডার:</span>
                    <span className="font-bold text-slate-800">
                      {bookingOrder.courierName || courierProvider.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">কনসাইনমেন্ট ট্র্যাকিং আইডি:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      <span>{bookingResult.consignmentId}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(bookingResult.consignmentId);
                          alert("Tracking ID copied to clipboard!");
                        }}
                        className="hover:text-emerald-900"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">অর্ডার স্ট্যাটাস:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                      SHIPPED
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  {bookingResult.trackingUrl && (
                    <a
                      href={bookingResult.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>লাইভ ট্র্যাকিং পেজ দেখুন</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setBookingOrder(null);
                      setBookingResult(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    সম্পন্ন (Done)
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleDispatchCourier} className="mt-4 space-y-4 text-xs">
                {/* Recipient & COD Summary */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>প্রাপক (Customer Delivery Details)</span>
                    <span className="text-[10px] text-slate-400 font-mono">D1 Database Verified</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800 block">নাম:</span>
                      {bookingOrder.customerName}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">ফোন নাম্বার:</span>
                      <span className="font-mono">{bookingOrder.customerPhone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-slate-800 block">ডেলিভারি ঠিকানা:</span>
                      {bookingOrder.shippingAddress}, {bookingOrder.city}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">
                      কুরিয়ার ক্যাশ কালেকশন (COD Amount):
                    </span>
                    <span className="font-black text-sm text-slate-900 font-mono">
                      {bookingOrder.paymentMethod === "cod"
                        ? `৳${Math.round(bookingOrder.total / 100)}`
                        : "৳0 (Pre-paid / অনলাইন পেইড)"}
                    </span>
                  </div>
                </div>

                {/* Choose Courier Service */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2">
                    কুরিয়ার সার্ভিস সিলেক্ট করুন (Select Courier Service) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "steadfast", label: "Steadfast", sub: "Most Popular" },
                      { id: "redx", label: "RedX", sub: "64 Districts" },
                      { id: "pathao", label: "Pathao", sub: "Express" },
                      { id: "paperfly", label: "Paperfly", sub: "Nationwide" },
                      { id: "ecourier", label: "eCourier", sub: "Fast Delivery" },
                      { id: "sundarban", label: "Sundarban", sub: "Parcel Hub" },
                      { id: "sa_paribahan", label: "SA Paribahan", sub: "Condition" },
                      { id: "manual", label: "Other / Manual", sub: "Custom Parcel" },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCourierProvider(c.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          courierProvider === c.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-extrabold text-xs leading-tight">{c.label}</div>
                        <div
                          className={`text-[10px] leading-tight mt-0.5 ${
                            courierProvider === c.id ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {c.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Courier Note / Parcel Special Instruction */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    কুরিয়ার ডেলিভারি নোট / স্পেশাল ইন্সট্রাকশন (Optional)
                  </label>
                  <input
                    type="text"
                    value={courierNote}
                    onChange={(e) => setCourierNote(e.target.value)}
                    placeholder="e.g. পার্সেল সাবধানে হ্যান্ডেল করুন / ডেলিভারির আগে কল দিন"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                {/* API Status Notice */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2 text-[11px] text-indigo-900">
                  <div className="text-indigo-600 mt-0.5">ℹ️</div>
                  <div>
                    {courierProvider === "steadfast" && courierSettings.steadfastApiKey ? (
                      <span className="font-semibold text-emerald-700">
                        ✓ Steadfast লাইভ API Key সক্রিয় আছে। বুকিং বাটনে চাপলে সরাসরি Steadfast পোর্টালে পার্সেল অর্ডার চলে যাবে।
                      </span>
                    ) : courierProvider === "redx" && courierSettings.redxToken ? (
                      <span className="font-semibold text-emerald-700">
                        ✓ RedX Delivery লাইভ API Token সক্রিয় আছে।
                      </span>
                    ) : courierProvider === "pathao" && courierSettings.pathaoToken ? (
                      <span className="font-semibold text-emerald-700">
                        ✓ Pathao Courier লাইভ Bearer Token সক্রিয় আছে।
                      </span>
                    ) : (
                      <span>
                        সেটিংস এ লাইভ API Credentials না থাকলে অটোমেটিক ট্র্যাকেবল কনসাইনমেন্ট কোড তৈরি করে Cloudflare D1-এ সেভ হবে। লাইভ API সেট করতে{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setBookingOrder(null);
                            setActiveTab("settings");
                          }}
                          className="font-bold underline text-indigo-700 hover:text-indigo-900"
                        >
                          সেটিংস পেজে যান &rarr;
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingOrder(null);
                      setBookingResult(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={isBookingCourier}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-xs transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {isBookingCourier
                        ? "কুরিয়ারে বুকিং হচ্ছে..."
                        : "কুরিয়ারে ডাটা পাঠান (Confirm Dispatch)"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Product Edit / Create Modal with R2 Uploader                       */}
      {/* ------------------------------------------------------------------ */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base">
                {editingProduct.id ? "Edit Product" : "Create New Product"}
              </h4>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
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
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
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
                    placeholder="4900 = $49.00"
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

              {/* R2 Image Uploader */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Images (Cloudflare R2 Object Storage)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer font-bold text-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? "Uploading to R2..." : "Upload Photo to R2"}</span>
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

      {/* ------------------------------------------------------------------ */}
      {/* Category Creation Modal                                            */}
      {/* ------------------------------------------------------------------ */}
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
                  placeholder="e.g. Watches & Accessories"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="e.g. watches"
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
  );
};
