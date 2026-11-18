import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Bot, 
  Headphones, 
  Laptop, 
  Smartphone, 
  Home, 
  SlidersHorizontal 
} from 'lucide-react';
import { ProductCard } from '../products/ProductCard';
import { productsApi, categoriesApi } from '../../services/api';
import { Product, Category } from '../../types';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productsApi.getFeatured(8),
          categoriesApi.getAll(),
        ]);

        if (prodRes.success && prodRes.data) {
          setFeaturedProducts(prodRes.data);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'laptops-computers': return <Laptop className="w-5 h-5" />;
      case 'smartphones-tablets': return <Smartphone className="w-5 h-5" />;
      case 'audio-wearables': return <Headphones className="w-5 h-5" />;
      case 'smart-home-iot': return <Home className="w-5 h-5" />;
      default: return <SlidersHorizontal className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-slate-50 pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100/80 border border-brand-200/80 text-brand-800 text-xs font-bold tracking-wide">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>ShopAI • Intelligent E-Commerce 2026</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Next-Gen Tech Gear. <br />
                <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Intelligently Advised.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Explore an elite collection of flagship laptops, high-fidelity acoustics, and smart home ecosystems—guided 24/7 by our built-in AI concierge.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/products"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-brand-600 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-slate-900/10 hover:shadow-brand-500/25 transition-all duration-300 hover:scale-[1.02]"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/products?featuredOnly=true"
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-subtle transition-colors"
                >
                  <span>Featured Highlights</span>
                </Link>
              </div>

              {/* Value stats */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200/60 max-w-md mx-auto lg:mx-0">
                <div>
                  <h4 className="text-2xl font-black text-slate-900">100%</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Authentic Gear</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900">&lt; 3s</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">AI Query Time</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900">30-Day</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Free Returns</p>
                </div>
              </div>
            </div>

            {/* Visual Hero Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-tr from-brand-600 to-indigo-700 p-1 shadow-2xl">
                  <div className="w-full h-full bg-slate-900 rounded-[22px] overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                      alt="Apex Pro Headphones"
                      className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                      <span className="px-3 py-1 bg-brand-500/80 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider w-fit mb-2">
                        Spotlight of the Week
                      </span>
                      <h3 className="text-xl font-extrabold text-white">ShopAI Apex Pro Wireless</h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        Dual 40mm beryllium drivers with custom 42dB adaptive active noise cancellation.
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-black text-white">$249.99</span>
                        <Link
                          to="/products/shopai-apex-pro-wireless-anc-headphones"
                          className="px-4 py-2 bg-white text-slate-900 hover:bg-brand-400 rounded-xl text-xs font-bold transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating AI badge */}
                <div className="absolute -bottom-5 -left-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3.5 max-w-xs">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">AI Concierge Live</h5>
                    <p className="text-[11px] text-slate-500">Ask anytime for real-time recommendations & order tracking.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Category Pills Navigation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Explore by Category</h2>
            <p className="text-xs text-slate-500 mt-1">Select a category to filter our specialized product lineup</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?categorySlug=${c.slug}`}
              className="group p-5 bg-white rounded-2xl border border-slate-100 hover:border-brand-300 hover:shadow-premium transition-all duration-300 flex flex-col items-center text-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center transition-all duration-300">
                {getCategoryIcon(c.slug)}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-brand-600 transition-colors">
                  {c.name}
                </h4>
                <span className="text-[10px] text-slate-400 mt-0.5 inline-block font-medium">
                  {c.productCount} products
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Handpicked Selections</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Trending & Best Selling</h2>
          </div>
          <Link to="/products" className="text-xs font-bold text-slate-700 hover:text-brand-600 flex items-center gap-1">
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* AI Customer Support Interactive Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold">
              <Bot className="w-4 h-4 text-brand-400" />
              <span>Real-Time Support Available</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Need assistance picking the right hardware?
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Our intelligent shopping assistant knows every product spec, warranty detail, and delivery estimate. Ask in natural language or track existing packages right now.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full text-xs font-bold shadow-lg transition-colors"
              >
                Start Exploring
              </Link>
              <Link
                to="/orders/track"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold backdrop-blur-md transition-colors"
              >
                Track An Order
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none hidden lg:block bg-gradient-to-l from-brand-500/40 to-transparent" />
        </div>
      </section>

      {/* Why ShopAI Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-subtle space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Zero Overselling Guarantee</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Powered by strict relational database transactions and inventory locking so you never experience backorders or cancelled transactions.
            </p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-subtle space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Verified Purchase Reviews</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Customer ratings can only be submitted after verified delivery confirmation, guaranteeing authentic reviews from real users.
            </p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-subtle space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Integrated AI Concierge</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trained on our catalog knowledge base to provide instant answers to delivery queries, product comparisons, and order status lookups.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
