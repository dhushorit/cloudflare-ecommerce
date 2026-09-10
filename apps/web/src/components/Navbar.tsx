import React, { useState } from "react";
import { ShoppingBag, Search, PackageCheck, ShieldCheck, X } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                onSelectCategory(null);
                onSearchChange("");
              }}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  AURA<span className="text-indigo-600">.</span>
                </span>
                <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded">
                  Edge
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, gear, apparel..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 rounded-full transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Track Order */}
            <button
              onClick={onOpenTracker}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Track Order</span>
            </button>

            {/* Admin Dashboard */}
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-900 text-white rounded-full hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-fade-in">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
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

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-100">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
