import React from 'react';
import { Sparkles } from 'lucide-react';

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-800 tracking-wide">Loading Experience</p>
        <p className="text-[10px] text-slate-400">ShopAI Intelligent Engine</p>
      </div>
    </div>
  );
};
