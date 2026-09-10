import React from "react";
import { Zap, ShieldCheck, Truck, Send, Globe2, Sparkles, ArrowUpRight } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-10 pb-12 sm:pt-14 sm:pb-16">
      {/* Background Ambient Glow & Subtle Pattern */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="absolute inset-0 hero-grid pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Edge Network Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/70 text-indigo-900 text-xs font-semibold shadow-xs mb-5 animate-fade-in backdrop-blur-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span className="font-mono text-[11px] text-indigo-700 uppercase tracking-wider">Cloudflare Edge v2.4</span>
            <span className="text-indigo-300">•</span>
            <span className="text-slate-700 font-medium">300+ Global Edge Locations Active</span>
          </div>
        </div>

        {/* Hero Title with Enterprise Typography */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
            High-Performance Commerce.{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
              Engineered for the Edge.
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Curated essentials delivered at sub-50ms latency. Powered by Cloudflare Workers, 
            serverless D1 SQLite, R2 object storage, and automated instant fulfillment dispatch.
          </p>
        </div>

        {/* 4 Feature Capability Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-5xl mx-auto">
          
          {/* Card 1: Latency */}
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                &lt; 50ms
              </span>
            </div>
            <h2 className="text-xs font-extrabold text-slate-900 tracking-tight">Zero-Cold-Start Edge</h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Instant edge query execution directly near customer location.
            </p>
          </div>

          {/* Card 2: Atomic Inventory */}
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                Guaranteed
              </span>
            </div>
            <h2 className="text-xs font-extrabold text-slate-900 tracking-tight">Atomic D1 Inventory</h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Database transactions prevent race conditions &amp; overselling.
            </p>
          </div>

          {/* Card 3: Instant Dispatch */}
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
                <Send className="w-4 h-4" />
              </div>
              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">
                Real-time
              </span>
            </div>
            <h2 className="text-xs font-extrabold text-slate-900 tracking-tight">Telegram &amp; Courier Sync</h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Instant alerts and courier airway bill dispatch on every order.
            </p>
          </div>

          {/* Card 4: Payments & COD */}
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600">
                <Truck className="w-4 h-4" />
              </div>
              <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/50">
                Nationwide
              </span>
            </div>
            <h2 className="text-xs font-extrabold text-slate-900 tracking-tight">Cash on Delivery + MFS</h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Doorstep delivery with bKash, Nagad &amp; Rocket payment choices.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
