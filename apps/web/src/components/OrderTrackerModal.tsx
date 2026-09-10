import React, { useState } from "react";
import { X, Search, Package, Clock, CheckCircle, Truck, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import type { Order } from "../types";

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = "",
}) => {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) {
      setError("Please enter both your Order ID and Phone Number.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrder(null);

    try {
      const data = await api.trackOrder(orderId.trim(), phone.trim());
      setOrder(data);
    } catch (err: any) {
      setError(err.message || "Could not find order. Please verify your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusSteps = [
    { key: "pending", label: "Order Received", icon: Clock },
    { key: "processing", label: "Processing", icon: Package },
    { key: "shipped", label: "Shipped / In Transit", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle },
  ];

  const currentStepIndex = order
    ? statusSteps.findIndex((s) => s.key === order.status)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-fade-in my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Track Your Order</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Check real-time fulfillment and dispatch status
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Lookup Form */}
          <form onSubmit={handleTrack} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ORD-202609-XXXX"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Phone used during checkout"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              {isLoading ? "Searching..." : "Track Status"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Status Display */}
          {order && (
            <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in space-y-6">
              {/* Order Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Order ID
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {order.id}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Payment
                  </div>
                  <div className="text-xs font-bold text-slate-800 uppercase">
                    {order.paymentMethod} ({order.paymentStatus})
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Total
                  </div>
                  <div className="text-xs font-bold text-indigo-600">
                    ${(order.total / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400">
                  Fulfillment Progress
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {statusSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                              : isCompleted
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`mt-2 text-[11px] font-semibold leading-tight ${
                            isCompleted ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Purchased Items */}
              {order.items && order.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">
                    Items in this Order
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 text-xs flex justify-between items-center bg-white"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {item.productTitle}
                          </div>
                          <div className="text-slate-500">Qty: {item.quantity}</div>
                        </div>
                        <div className="font-mono font-bold text-slate-900">
                          ${(item.totalPrice / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
