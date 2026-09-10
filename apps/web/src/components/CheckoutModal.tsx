import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Truck,
  Smartphone,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderCompleted,
}) => {
  const { items, subtotal, shippingCost, total, clearCart } = useCart();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad" | "rocket" | "bank_transfer">("cod");
  const [paymentTrxId, setPaymentTrxId] = useState("");

  // UI Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; total: number } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setErrorMessage("Please fill in all required shipping fields.");
      return;
    }

    if (paymentMethod !== "cod" && !paymentTrxId.trim()) {
      setErrorMessage(`Please provide the Transaction ID for your ${paymentMethod.toUpperCase()} payment.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.checkout({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        shippingAddress: address.trim(),
        city: city.trim(),
        notes: notes.trim() || undefined,
        paymentMethod,
        paymentTrxId: paymentTrxId.trim() || undefined,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });

      if (response.success) {
        setCompletedOrder(response.order);
        clearCart();
        if (onOrderCompleted) {
          onOrderCompleted(response.order.id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Checkout failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderId = () => {
    if (completedOrder) {
      navigator.clipboard.writeText(completedOrder.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-fade-in my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {completedOrder ? "Order Confirmed!" : "Checkout"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedOrder
                ? "We're preparing your order for prompt delivery."
                : "Safe & encrypted checkout with doorstep delivery"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Order View */}
        {completedOrder ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h4 className="text-2xl font-black text-slate-900">
              Thank You, {name}!
            </h4>
            <p className="text-sm text-slate-600 mt-1 max-w-md leading-relaxed">
              Your order has been successfully placed. Our fulfillment team is preparing your package for dispatch. You can track your delivery anytime using your Order Reference below.
            </p>

            {/* Order Reference Box */}
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 w-full max-w-md text-left flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Order ID Reference
                </span>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {completedOrder.id}
                </div>
              </div>
              <button
                onClick={copyOrderId}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors shadow-2xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Input Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Customer Info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                1. Delivery &amp; Contact Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 555-0199 or 01712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional for receipt)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House/Apt, Road, Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York, Dhaka, etc."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call before delivery"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Payment Method */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                2. Select Payment Method
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === "cod"
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Truck className="w-5 h-5 text-indigo-600 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Cash on Delivery</div>
                    <div className="text-[10px] text-slate-500">Pay when received</div>
                  </div>
                </button>

                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === "bkash"
                      ? "border-pink-600 bg-pink-50/50 shadow-xs ring-1 ring-pink-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-pink-600 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">bKash</div>
                    <div className="text-[10px] text-slate-500">Send Money / Merchant</div>
                  </div>
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("nagad")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === "nagad"
                      ? "border-orange-600 bg-orange-50/50 shadow-xs ring-1 ring-orange-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-orange-600 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Nagad</div>
                    <div className="text-[10px] text-slate-500">Instant transfer</div>
                  </div>
                </button>
              </div>

              {/* Mobile Banking Instructions & TrxID Input */}
              {paymentMethod !== "cod" && (
                <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in">
                  <div className="text-xs text-slate-700 leading-relaxed mb-3">
                    <span className="font-bold">Instructions:</span> Please send the total amount to{" "}
                    <code className="px-1.5 py-0.5 bg-slate-200 rounded font-mono font-bold text-slate-900">
                      01700-000000 ({paymentMethod.toUpperCase()} Personal/Merchant)
                    </code>{" "}
                    and input your transaction reference ID below.
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {paymentMethod.toUpperCase()} Transaction ID (TrxID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9B8X2KLP"
                      value={paymentTrxId}
                      onChange={(e) => setPaymentTrxId(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-mono uppercase"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary & Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left w-full sm:w-auto">
                <div className="text-xs text-slate-500">
                  Total Payable ({items.length} items)
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ${(total / 100).toFixed(2)}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>Confirm Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
