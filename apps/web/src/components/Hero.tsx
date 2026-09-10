import React from "react";
import { Truck, ShieldCheck, RefreshCw, Smartphone, Sparkles, ArrowRight } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-10 pb-12 sm:pt-14 sm:pb-16">
      {/* Background Ambient Glow & Subtle Pattern */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="absolute inset-0 hero-grid pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Collection Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-semibold shadow-2xs mb-5 animate-fade-in backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold tracking-wide">Curated Collection 2026</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-normal">Handpicked Everyday Essentials</span>
          </div>
        </div>

        {/* Hero Title with Consumer Focus */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
            Minimalist Essentials.{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-900 bg-clip-text text-transparent">
              Designed for Living.
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Discover thoughtfully engineered audio gear, workspace ergonomics, and premium organic apparel crafted for lasting quality, comfort, and quiet aesthetics.
          </p>
        </div>

        {/* 4 Customer-First Benefit Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-5xl mx-auto">
          
          {/* Benefit 1: Free Express Delivery */}
          <div className="p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">
                Over $100
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Express Delivery</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Fast nationwide shipping with doorstep tracking updates.
            </p>
          </div>

          {/* Benefit 2: Authenticity */}
          <div className="p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                100% Genuine
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Official Warranty</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Original hardware backed by manufacturer warranties.
            </p>
          </div>

          {/* Benefit 3: Cash on Delivery & MFS */}
          <div className="p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                COD + MFS
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Doorstep Payment</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Pay upon physical inspection, or via bKash &amp; Nagad.
            </p>
          </div>

          {/* Benefit 4: Easy Returns */}
          <div className="p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600">
                <RefreshCw className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/50">
                7 Days
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Hassle-Free Returns</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Straightforward replacement policy if you change your mind.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
