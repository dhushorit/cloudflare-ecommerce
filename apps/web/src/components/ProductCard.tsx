import React, { useState } from "react";
import { Plus, Check, Eye, Star, AlertCircle, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = items.find((item) => item.product.id === product.id);
  const currentInCart = cartItem?.quantity || 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const canAddMore = currentInCart < product.stock;

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

  const formattedPrice = (product.price / 100).toFixed(2);
  const formattedComparePrice = product.compareAtPrice
    ? (product.compareAtPrice / 100).toFixed(2)
    : null;

  // Calculate discount percent
  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || !canAddMore) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div 
      onClick={() => onSelect(product)}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* 1. Product Image Frame with Ambient Hover & Actions */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={primaryImage}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top Badges (Stock, Featured, Discount) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
          <div className="flex flex-col gap-1.5 items-start">
            {discountPercent && (
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white rounded-md shadow-xs">
                -{discountPercent}%
              </span>
            )}
            {product.isFeatured && !discountPercent && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white rounded-md shadow-xs">
                Featured
              </span>
            )}
          </div>

          <div>
            {isOutOfStock ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 text-white rounded-md shadow-xs backdrop-blur-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-400" /> Sold Out
              </span>
            ) : isLowStock ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/95 text-white rounded-md shadow-xs backdrop-blur-xs">
                Only {product.stock} Left
              </span>
            ) : null}
          </div>
        </div>

        {/* Floating Quick Action Overlay on Desktop Hover */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 ease-out">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex-1 py-2 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md backdrop-blur-xs flex items-center justify-center gap-1.5 border border-slate-200/80 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* 2. Product Meta & Details */}
      <div className="flex flex-col flex-1 p-4">
        {/* SKU & Category Code */}
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-mono text-slate-400 uppercase tracking-wider">
            {product.sku || "SKU-PROD"}
          </span>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-3 h-3 fill-amber-400 stroke-none" />
            <span className="text-[11px] font-semibold text-slate-700">4.9</span>
            <span className="text-[10px] text-slate-400 font-normal">(40+)</span>
          </div>
        </div>

        {/* Title */}
        <h3
          className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors line-clamp-1 leading-snug"
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Short Description */}
        {product.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price & Action Area */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-slate-950 tabular-nums">
                ${formattedPrice}
              </span>
              {formattedComparePrice && (
                <span className="text-xs font-medium text-slate-400 line-through tabular-nums">
                  ${formattedComparePrice}
                </span>
              )}
            </div>
            
            {/* Live Stock Status Indicator */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isOutOfStock 
                  ? "bg-rose-500" 
                  : isLowStock 
                  ? "bg-amber-500 animate-pulse" 
                  : "bg-emerald-500"
              }`}></span>
              <span className="text-[10px] font-medium text-slate-500">
                {isOutOfStock ? "Out of stock" : isLowStock ? `Low stock (${product.stock})` : "In stock"}
              </span>
            </div>
          </div>

          {/* Quick Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || !canAddMore}
            className={`p-2.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center ${
              justAdded
                ? "bg-emerald-600 text-white scale-105 shadow-sm"
                : isOutOfStock
                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                : !canAddMore
                ? "bg-slate-200 text-slate-500 cursor-default"
                : "bg-slate-950 hover:bg-indigo-600 text-white shadow-xs hover:shadow-glow active:scale-95"
            }`}
            title={
              isOutOfStock
                ? "Item is sold out"
                : !canAddMore
                ? "Maximum available stock already in cart"
                : "Add 1 to Cart"
            }
          >
            {justAdded ? (
              <Check className="w-4 h-4 animate-scale-in stroke-[2.5]" />
            ) : !canAddMore && !isOutOfStock ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
