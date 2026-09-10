import React, { useState } from "react";
import { X, Plus, Minus, ShoppingBag, ShieldCheck, Check } from "lucide-react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart, items } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const cartItem = items.find((item) => item.product.id === product.id);
  const currentInCart = cartItem?.quantity || 0;
  const maxAvailableToAdd = Math.max(0, product.stock - currentInCart);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"];

  const handleAdd = () => {
    if (selectedQty > 0 && selectedQty <= maxAvailableToAdd) {
      addToCart(product, selectedQty);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-full transition-all shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Gallery Area */}
          <div className="p-6 bg-slate-50 flex flex-col justify-between">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-xs border border-slate-200/60">
              <img
                src={images[activeImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? "border-indigo-600 scale-105 shadow-xs"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Area */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded-md">
                  {product.category?.name || "Product"}
                </span>
                {product.sku && (
                  <span className="text-[10px] font-mono text-slate-400">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-xl font-extrabold text-slate-900 leading-tight">
                {product.title}
              </h2>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  ${(product.price / 100).toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm font-medium text-slate-400 line-through">
                    ${(product.compareAtPrice / 100).toFixed(2)}
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description || "No description provided."}
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {product.stock > 0
                    ? `In Stock (${product.stock} units available)`
                    : "Currently Out of Stock"}
                </span>
              </div>
            </div>

            {/* Quantity Selector & Action */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              {product.stock > 0 ? (
                maxAvailableToAdd > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Quantity</span>
                      <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                          onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                          className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-slate-900 w-6 text-center">
                          {selectedQty}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedQty((q) => Math.min(maxAvailableToAdd, q + 1))
                          }
                          className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleAdd}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart • ${( (product.price * selectedQty) / 100 ).toFixed(2)}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-800">
                    Maximum available quantity ({product.stock}) is already in your cart.
                  </div>
                )
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 bg-slate-200 text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed"
                >
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
