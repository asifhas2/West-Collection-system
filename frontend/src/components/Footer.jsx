import React from 'react';
import { Recycle, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Recycle className="w-5 h-5 text-emerald-400" />
          <span>Smart Waste Collection & Reward System</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" /> 100% C Language REST Backend Powered
          </span>
          <span>•</span>
          <span>SRS Compliant Capstone Architecture</span>
        </div>
        <div className="text-xs text-slate-500">
          Designed for Urban Recycling & Clean Environment
        </div>
      </div>
    </footer>
  );
}
