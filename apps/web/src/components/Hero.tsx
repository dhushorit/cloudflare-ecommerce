import React from "react";
import { Zap, ShieldCheck, Truck, Send } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-b border-slate-200/60 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Cloudflare Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold mb-4 animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>100% Serverless Edge Architecture</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto">
          Speed, simplicity &amp;{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            curated essentials.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
          Ultra-responsive storefront hosted on Cloudflare Pages, powered by D1 SQLite, R2 object storage, and instant Telegram dispatch.
        </p>

        {/* Feature Badges */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
            <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Cash on Delivery</div>
              <div className="text-[11px] text-slate-500">Pay at your doorstep</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Atomic Stock</div>
              <div className="text-[11px] text-slate-500">Zero overselling guarantee</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
            <Send className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Instant Alert</div>
              <div className="text-[11px] text-slate-500">Real-time Telegram bot</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Mobile Banking</div>
              <div className="text-[11px] text-slate-500">bKash, Nagad &amp; Rocket</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
