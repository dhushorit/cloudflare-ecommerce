import React from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from "lucide-react";
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

  const FREE_SHIPPING_THRESHOLD = 10000; // $100.00
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h2 className="font-extrabold text-slate-900 text-lg">Your Cart</h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                {remainingForFreeShipping === 0
                  ? "🎉 You qualified for FREE Shipping!"
                  : `Add $${(remainingForFreeShipping / 100).toFixed(2)} more for Free Shipping`}
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                <ShoppingBag className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 text-base">Your cart is empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Discover curated items in our catalog and add them to your cart.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const img =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

                return (
                  <div key={product.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                    <img
                      src={img}
                      alt={product.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200/60 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {product.title}
                      </h4>
                      <div className="text-xs font-semibold text-slate-500 mt-0.5">
                        ${(product.price / 100).toFixed(2)} each
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 w-5 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stock}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-auto"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right font-extrabold text-sm text-slate-900 shrink-0">
                      ${((product.price * quantity) / 100).toFixed(2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50">
              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    ${(subtotal / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase text-[11px]">
                        Free
                      </span>
                    ) : (
                      `$${(shippingCost / 100).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
                  title="Clear Cart"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onOpenCheckout();
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
