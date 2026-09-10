import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { OrderTrackerModal } from "./components/OrderTrackerModal";
import { AdminPortal } from "./components/AdminPortal";
import { api } from "./lib/api";
import type { Product, Category } from "./types";
import { Sparkles, PackageOpen, ShoppingBag, ShieldCheck, Truck, RefreshCw, Lock } from "lucide-react";

export const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // View Routing: Storefront vs Full-Screen Dedicated Admin Portal
  const [currentView, setCurrentView] = useState<"storefront" | "admin">(() => {
    return window.location.hash === "#admin" ? "admin" : "storefront";
  });

  // Listen for hash changes (e.g. #admin)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(window.location.hash === "#admin" ? "admin" : "storefront");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [lastCompletedOrderId, setLastCompletedOrderId] = useState<string>("");

  useEffect(() => {
    loadInitialCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

  const loadInitialCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProducts({
        category: selectedCategory || undefined,
        q: searchQuery || undefined,
      });
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setIsLoading(false);
    }
  };

  // If Admin Portal view is active, render the dedicated Full-Page Portal
  if (currentView === "admin") {
    return (
      <AdminPortal
        onBackToStore={() => {
          window.location.hash = "";
          setCurrentView("storefront");
        }}
        categories={categories}
        onRefreshCategories={loadInitialCategories}
      />
    );
  }

  // Active Category Name Helper
  const currentCategoryName = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.name || "Category"
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* 1. Customer Navigation Bar */}
      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      {/* 2. Hero Section (shown on default collection view) */}
      {!selectedCategory && !searchQuery && <Hero />}

      {/* 3. Main Catalog Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : currentCategoryName
                  ? currentCategoryName
                  : "Curated Catalog"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {searchQuery
                ? `Showing matching products for "${searchQuery}"`
                : currentCategoryName
                ? `Discover premium handpicked items in ${currentCategoryName}`
                : "Handpicked premium essentials crafted for longevity and modern lifestyle."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white border border-slate-200/80 rounded-lg text-xs font-bold text-slate-700 shadow-2xs">
              {products.length} {products.length === 1 ? "Product" : "Products"} Available
            </span>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/70 p-4 animate-pulse flex flex-col gap-3 shadow-card"
              >
                <div className="aspect-square bg-slate-100 rounded-xl w-full" />
                <div className="flex justify-between items-center mt-1">
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/6" />
                </div>
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-50">
                  <div className="h-6 bg-slate-100 rounded w-1/3" />
                  <div className="h-9 w-9 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty Catalog / Search State */
          <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 shadow-card px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <PackageOpen className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              {searchQuery
                ? `We couldn't find any products matching "${searchQuery}". Try a different keyword.`
                : "No items are currently listed in this category."}
            </p>

            {/* Keyword Suggestions */}
            {searchQuery && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {["Headphones", "Keyboard", "Tee"].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-semibold text-slate-600 transition-colors"
                  >
                    Try "{term}"
                  </button>
                ))}
              </div>
            )}

            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="mt-6 px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-xs"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* 4. Professional Storefront Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Column 1: Brand Essence */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white font-black text-sm">
                  A
                </div>
                <span className="font-black text-lg text-slate-950">AURA<span className="text-indigo-600">.</span></span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dedicated to minimalist design, precision-engineered audio gear, and sustainable apparel crafted for lasting everyday comfort.
              </p>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Official Retailer</span>
              </div>
            </div>

            {/* Column 2: Collections */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider mb-3">Collections</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li>
                  <button onClick={() => { setSelectedCategory(null); setSearchQuery(""); }} className="hover:text-indigo-600 transition-colors">
                    All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button onClick={() => setSelectedCategory(cat.slug)} className="hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider mb-3">Customer Care</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li>
                  <button onClick={() => setIsTrackerOpen(true)} className="hover:text-indigo-600 transition-colors">
                    Track Your Order
                  </button>
                </li>
                <li>
                  <span className="text-slate-500 hover:text-slate-700 cursor-pointer">Shipping &amp; Delivery Terms</span>
                </li>
                <li>
                  <span className="text-slate-500 hover:text-slate-700 cursor-pointer">7-Day Replacement Policy</span>
                </li>
                <li>
                  <span className="text-slate-500 hover:text-slate-700 cursor-pointer">Warranty &amp; Support</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Payment Acceptance */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider mb-3">Payment &amp; Security</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Shop with confidence. We support physical doorstep inspection alongside secure mobile banking.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md border border-slate-200">
                  Cash on Delivery
                </span>
                <span className="px-2.5 py-1 bg-pink-50 text-pink-700 text-[11px] font-bold rounded-md border border-pink-200/60">
                  bKash
                </span>
                <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-[11px] font-bold rounded-md border border-orange-200/60">
                  Nagad
                </span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-md border border-purple-200/60">
                  Rocket
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Legal & Discrete Staff Portal */}
        <div className="border-t border-slate-100 py-6 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} AURA Lifestyle Inc. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
              <span>•</span>
              {/* Discrete Staff Portal link for store management */}
              <button
                onClick={() => {
                  window.location.hash = "admin";
                  setCurrentView("admin");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Staff Management Portal"
              >
                Staff Portal
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. Modals & Slide-overs */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onQuickCheckout={() => {
          setSelectedProduct(null);
          setIsCheckoutOpen(true);
        }}
      />

      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderCompleted={(orderId) => {
          setLastCompletedOrderId(orderId);
        }}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialOrderId={lastCompletedOrderId}
      />
    </div>
  );
};
