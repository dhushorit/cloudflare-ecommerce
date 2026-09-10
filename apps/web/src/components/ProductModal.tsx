import React, { useState } from "react";
import { X, Plus, Minus, ShoppingBag, ShieldCheck, Check, Star, Truck, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onQuickCheckout?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onQuickCheckout }) => {
  const { addToCart, items, setIsCartOpen } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "shipping" | "warranty">("overview");

  if (!product) return null;

  const cartItem = items.find((item) => item.product.id === product.id);
  const currentInCart = cartItem?.quantity || 0;
  const maxAvailableToAdd = Math.max(0, product.stock - currentInCart);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"];

  const formattedPrice = (product.price / 100).toFixed(2);
  const formattedComparePrice = product.compareAtPrice
    ? (product.compareAtPrice / 100).toFixed(2)
    : null;

  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const handleAdd = () => {
    if (selectedQty > 0 && selectedQty <= maxAvailableToAdd) {
      addToCart(product, selectedQty);
      onClose();
      setIsCartOpen(true);
    }
  };

  const handleInstantCheckout = () => {
    if (selectedQty > 0 && selectedQty <= maxAvailableToAdd) {
      addToCart(product, selectedQty);
      onClose();
      if (onQuickCheckout) {
        onQuickCheckout();
      } else {
        setIsCartOpen(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-modal overflow-hidden border border-slate-200/80 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-900 bg-white/90 hover:bg-white rounded-full transition-all shadow-sm border border-slate-200/60"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* 1. High-Resolution Gallery */}
          <div className="p-6 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200/70 flex flex-col justify-between">
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xs border border-slate-200/70">
                <img
                  src={images[activeImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
                {discountPercent && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-rose-600 text-white rounded-lg shadow-sm">
                    Save {discountPercent}%
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        activeImageIndex === idx
                          ? "border-indigo-600 ring-2 ring-indigo-500/20 scale-105"
                          : "border-slate-200/80 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Guarantees Micro-Bar */}
            <div className="mt-6 pt-4 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                Nationwide COD
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                100% Authentic
              </span>
            </div>
          </div>

          {/* 2. Product Specs & Actions */}
          <div className="p-6 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Category & SKU Pill */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-md">
                  {product.category?.name || "Hardware & Essentials"}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {product.sku || "SKU-PROD-01"}
                </span>
              </div>

              {/* Title */}
              <h2 className="mt-3 text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                {product.title}
              </h2>

              {/* Social Proof Star Rating */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">4.9 / 5.0</span>
                <span className="text-xs text-slate-400">• 128 Verified Buyer Reviews</span>
              </div>

              {/* Pricing Display */}
              <div className="mt-4 flex items-baseline gap-2.5 pb-4 border-b border-slate-100">
                <span className="text-3xl font-black text-slate-950 tabular-nums">
                  ${formattedPrice}
                </span>
                {formattedComparePrice && (
                  <span className="text-base font-semibold text-slate-400 line-through tabular-nums">
                    ${formattedComparePrice}
                  </span>
                )}
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50 ml-auto">
                  Tax Included
                </span>
              </div>

              {/* Tabs for Info / Shipping / Warranty */}
              <div className="mt-4">
                <div className="flex items-center gap-4 border-b border-slate-100 text-xs font-semibold pb-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`transition-colors ${
                      activeTab === "overview" ? "text-indigo-600 border-b-2 border-indigo-600 -mb-2 pb-2 font-bold" : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("shipping")}
                    className={`transition-colors ${
                      activeTab === "shipping" ? "text-indigo-600 border-b-2 border-indigo-600 -mb-2 pb-2 font-bold" : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Delivery &amp; COD
                  </button>
                  <button
                    onClick={() => setActiveTab("warranty")}
                    className={`transition-colors ${
                      activeTab === "warranty" ? "text-indigo-600 border-b-2 border-indigo-600 -mb-2 pb-2 font-bold" : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Warranty
                  </button>
                </div>

                <div className="py-3 min-h-[70px]">
                  {activeTab === "overview" && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {product.description || "High-performance enterprise hardware designed for durability and optimal performance."}
                    </p>
                  )}
                  {activeTab === "shipping" && (
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>• <strong>Dhaka City:</strong> Next-day delivery (Tk 60).</p>
                      <p>• <strong>Outside Dhaka:</strong> 2-3 business days (Tk 120).</p>
                      <p>• Pay via Cash on Delivery or Instant bKash / Nagad.</p>
                    </div>
                  )}
                  {activeTab === "warranty" && (
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>• 7-day hassle-free replacement guarantee.</p>
                      <p>• 1-year official hardware warranty coverage.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Verification Badge */}
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${
                  product.stock > 5 ? "bg-emerald-500" : product.stock > 0 ? "bg-amber-500" : "bg-rose-500"
                }`}></span>
                <span className="text-slate-700">
                  {product.stock > 0
                    ? `Atomic Stock: ${product.stock} units ready for immediate dispatch`
                    : "Currently Out of Stock"}
                </span>
              </div>
            </div>

            {/* Quantity Stepper & Dual Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {product.stock > 0 ? (
                maxAvailableToAdd > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Quantity</span>
                      <div className="flex items-center gap-3 bg-slate-100/80 rounded-xl p-1 border border-slate-200/80">
                        <button
                          onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                          className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors shadow-2xs"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-extrabold text-slate-900 w-8 text-center tabular-nums">
                          {selectedQty}
                        </span>
                        <button
                          onClick={() => setSelectedQty((q) => Math.min(maxAvailableToAdd, q + 1))}
                          className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors shadow-2xs"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={handleAdd}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-slate-200"
                      >
                        <ShoppingBag className="w-4 h-4 text-slate-700" />
                        Add to Cart
                      </button>

                      <button
                        onClick={handleInstantCheckout}
                        className="py-3 px-4 bg-slate-950 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-glow transition-all flex items-center justify-center gap-2"
                      >
                        <span>Buy Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
                    Maximum available stock ({product.stock}) is already in your cart.
                  </div>
                )
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 px-4 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed border border-slate-200"
                >
                  Sold Out • Backorder Opening Soon
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
