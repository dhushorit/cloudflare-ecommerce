import React from "react";
import { Plus, Check, AlertCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, items } = useCart();

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

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Product Image Container */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
      >
        <img
          src={primaryImage}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Stock Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-rose-500 text-white rounded-md shadow-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-white rounded-md shadow-xs">
              Only {product.stock} Left
            </span>
          ) : (
            product.isFeatured && (
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-600 text-white rounded-md shadow-xs">
                Featured
              </span>
            )
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-4">
        {product.sku && (
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {product.sku}
          </span>
        )}

        <h3
          onClick={() => onSelect(product)}
          className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
          title={product.title}
        >
          {product.title}
        </h3>

        {product.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price & Action Area */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900">
                ${formattedPrice}
              </span>
              {formattedComparePrice && (
                <span className="text-xs font-medium text-slate-400 line-through">
                  ${formattedComparePrice}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
            </span>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock || !canAddMore}
            className={`p-2.5 rounded-xl font-medium transition-all flex items-center justify-center ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : !canAddMore
                ? "bg-slate-200 text-slate-600 cursor-default"
                : "bg-slate-900 hover:bg-indigo-600 text-white shadow-xs hover:shadow-md active:scale-95"
            }`}
            title={
              isOutOfStock
                ? "Out of Stock"
                : !canAddMore
                ? "Max stock already in cart"
                : "Add to Cart"
            }
          >
            {!canAddMore && !isOutOfStock ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
