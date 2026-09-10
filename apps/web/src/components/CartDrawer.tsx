import React from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    shippingCost,
    total,
  } = useCart();

  if (!isCartOpen) return null;

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 10000; // $100.00
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/65 backdrop-blur-sm transition-opacity animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={() => setIsCartOpen(false)} 
        aria-hidden="true" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-modal flex flex-col animate-slide-in-right border-l border-slate-200">
          
          {/* 1. Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-950 text-base">Your Cart</h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  {totalQuantity} {totalQuantity === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Free Shipping Progress Meter */}
          <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                {remainingForFreeShipping === 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Unlocked FREE Express Delivery!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-slate-950">${(remainingForFreeShipping / 100).toFixed(2)}</strong> more for Free Shipping
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-500 font-mono font-bold">
                {Math.round(progressPercent)}%
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3. Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">Your cart is currently empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Browse our curated hardware and lifestyle collection to start building your order.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-xs"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const img =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

                return (
                  <div key={product.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5 items-center">
                    <img
                      src={img}
                      alt={product.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200/70 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={product.title}>
                        {product.title}
                      </h4>
                      <div className="text-[11px] font-semibold text-slate-400 mt-0.5 tabular-nums">
                        ${(product.price / 100).toFixed(2)} each
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1 text-slate-600 hover:text-slate-950 rounded hover:bg-white transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-extrabold text-slate-900 w-6 text-center tabular-nums">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stock}
                            className="p-1 text-slate-600 hover:text-slate-950 disabled:opacity-30 rounded hover:bg-white transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-auto"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right font-black text-sm text-slate-950 tabular-nums shrink-0">
                      ${((product.price * quantity) / 100).toFixed(2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/90">
              {/* Cost Summary Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 mb-4 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-950 tabular-nums">
                    ${(subtotal / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-slate-950">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-700 font-extrabold uppercase text-[11px] bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        FREE
                      </span>
                    ) : (
                      `$${(shippingCost / 100).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-slate-200 text-sm font-black text-slate-950">
                  <span>Total Amount</span>
                  <span className="text-base text-indigo-700 tabular-nums">
                    ${(total / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:text-rose-600 hover:border-rose-200 bg-white transition-colors"
                  title="Clear all items"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onOpenCheckout();
                  }}
                  className="flex-1 py-3 px-4 bg-slate-950 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-glow transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Security & COD Guarantee Footer */}
              <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  SSL Encrypted
                </span>
                <span>•</span>
                <span>Doorstep Cash on Delivery</span>
                <span>•</span>
                <span>7-Day Return</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
