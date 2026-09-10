import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, Search, PackageCheck, ShieldCheck, X, Zap, ChevronRight, Sparkles } from "lucide-react";
import { useCart } from "../context/CartContext";
import type { Category } from "../types";

interface NavbarProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenTracker,
  onOpenAdmin,
}) => {
  const { itemCount, setIsCartOpen } = useCart();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect scroll for dynamic shadow elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut: Press "/" or "Ctrl+K" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" || (e.ctrlKey && e.key === "k") || (e.metaKey && e.key === "k")) && 
          document.activeElement?.tagName !== "INPUT" && 
          document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200">
      {/* 1. Top Enterprise Notification Bar */}
      <div className="bg-slate-950 text-slate-300 text-[11px] font-medium tracking-wide border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider hidden sm:inline">
              Edge Network: Global Active
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-200 font-medium truncate">
              ⚡ Free Express Delivery on orders over $100 &amp; Instant Cash on Delivery
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-default">
              <Zap className="w-3 h-3 text-amber-400" />
              Sub-50ms D1 Database
            </span>
            <span>•</span>
            <button
              onClick={onOpenTracker}
              className="text-slate-300 hover:text-indigo-400 font-medium transition-colors"
            >
              Order Status Lookup
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main High-Fidelity Navigation Bar */}
      <div className={`glass-header transition-shadow duration-300 ${isScrolled ? "shadow-card" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            
            {/* Brand Logo & Tag */}
            <button
              onClick={() => {
                onSelectCategory(null);
                onSearchChange("");
              }}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950 text-white shadow-sm shadow-indigo-500/20 group-hover:scale-[1.03] transition-all duration-200 ring-1 ring-white/20">
                <ShoppingBag className="w-5 h-5 text-white stroke-[2.2]" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-slate-950">
                    AURA<span className="text-indigo-600">.</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-md">
                    Cloudflare
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5 hidden sm:block">
                  Enterprise Commerce
                </span>
              </div>
            </button>

            {/* Desktop Center Search Bar with Keyboard Cue */}
            <div className="hidden md:flex flex-1 max-w-lg relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-600" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, specifications, apparel..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-20 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 focus:border-indigo-600 rounded-xl transition-all outline-none shadow-xs focus:shadow-glow text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    onClick={() => {
                      onSearchChange("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs font-mono">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Right Action Icons & Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Toggle Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Track Order CTA */}
              <button
                onClick={onOpenTracker}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/80 rounded-xl border border-transparent hover:border-indigo-100 transition-all duration-150"
              >
                <PackageCheck className="w-4 h-4 text-slate-500" />
                <span>Track Order</span>
              </button>

              {/* Admin Portal Gateway */}
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl border border-slate-200/70 transition-all duration-150"
                title="Management Console"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Admin</span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              {/* High-Impact Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-950 text-white rounded-xl hover:bg-indigo-600 transition-all duration-200 shadow-sm hover:shadow-glow group focus:outline-none"
                aria-label="Open Cart"
              >
                <ShoppingBag className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                <span className="text-xs font-bold tracking-tight">Cart</span>
                <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full transition-colors ${
                  itemCount > 0 
                    ? "bg-indigo-500 text-white animate-scale-in" 
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {itemCount}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Search Popdown */}
          {isMobileSearchOpen && (
            <div className="md:hidden pb-3 pt-1 animate-fade-in">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products, gear, apparel..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. Sleek Enterprise Category Ribbon */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-100 scrollbar-none">
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
                selectedCategory === null
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
                  selectedCategory === cat.slug
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
