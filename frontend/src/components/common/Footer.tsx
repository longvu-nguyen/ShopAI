import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      {/* Features Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Free Express Shipping</h4>
              <p className="text-xs text-slate-400 mt-0.5">On orders over $100 nationwide</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Official Warranty</h4>
              <p className="text-xs text-slate-400 mt-0.5">12-month authentic coverage</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">30-Day Easy Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free money back guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">AI Customer Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">24/7 Intelligent shopping guidance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Shop<span className="text-brand-500">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              ShopAI is a modern e-commerce platform combining premium technology gear with next-generation conversational AI advisory.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <span className="inline-block px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 text-slate-300 font-mono">
                Full-Stack Portfolio Project • 2026
              </span>
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-4">Shop</h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?categorySlug=laptops-computers" className="hover:text-white transition-colors">Laptops & Computers</Link></li>
              <li><Link to="/products?categorySlug=audio-wearables" className="hover:text-white transition-colors">Audio & Wearables</Link></li>
              <li><Link to="/products?categorySlug=smartphones-tablets" className="hover:text-white transition-colors">Smartphones</Link></li>
              <li><Link to="/products?categorySlug=smart-home-iot" className="hover:text-white transition-colors">Smart Home</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-4">Support & Account</h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/orders/track" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Order History</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">Saved Wishlist</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Account Login</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-4">System Architecture</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>• ASP.NET Core 8 Web API</li>
              <li>• Clean Architecture Monolith</li>
              <li>• PostgreSQL + EF Core</li>
              <li>• React 18 + TypeScript</li>
              <li>• JWT Refresh Token Rotation</li>
              <li>• Intelligent AI Support Engine</li>
            </ul>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-400">
        <p>© 2026 ShopAI Platform. Designed and engineered for production-grade Full-Stack Developer portfolio demonstrations.</p>
      </div>
    </footer>
  );
};
