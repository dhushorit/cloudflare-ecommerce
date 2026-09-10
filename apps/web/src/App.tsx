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
import { Sparkles, PackageOpen } from "lucide-react";

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

  // Otherwise, render Customer Storefront
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation */}
      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAdmin={() => {
          window.location.hash = "admin";
          setCurrentView("admin");
        }}
      />

      {/* Hero Header */}
      {!selectedCategory && !searchQuery && <Hero />}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : selectedCategory
                ? categories.find((c) => c.slug === selectedCategory)?.name || "Category Products"
                : "Curated Catalog"}
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {products.length} product{products.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 animate-pulse flex flex-col gap-3"
              >
                <div className="aspect-square bg-slate-100 rounded-xl w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mt-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-6 bg-slate-100 rounded w-1/3 mt-auto" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty Search or Catalog */
          <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80">
            <PackageOpen className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery
                ? `We couldn't find anything matching "${searchQuery}". Try a different keyword.`
                : "No products currently available in this category."}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors"
              >
                Clear Filters
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

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">AURA.</span>
            <span>— 100% Serverless Edge Commerce on Cloudflare Pages &amp; Workers</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>D1 SQLite</span>
            <span>•</span>
            <span>R2 Object Storage</span>
            <span>•</span>
            <span>KV Cache</span>
            <span>•</span>
            <span>Telegram Webhook</span>
          </div>
        </div>
      </footer>

      {/* Storefront Slide-overs & Modals */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
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
