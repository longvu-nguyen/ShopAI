import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

export const WishlistPage: React.FC = () => {
  const { wishlist, toggleWishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-xs text-slate-400">Loading saved wishlist items...</p>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your wishlist is empty</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Save your favorite audio devices, ultrabooks, and smart tech to revisit them whenever you're ready.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-full text-xs font-bold hover:bg-brand-700 shadow-md transition-colors"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Saved Wishlist</h1>
        <p className="text-xs text-slate-500 mt-1">{wishlist.length} saved products</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-subtle hover:shadow-premium transition-all flex flex-col justify-between"
          >
            <div className="aspect-square bg-slate-100 overflow-hidden relative">
              <Link to={`/products/${item.productSlug}`}>
                <img
                  src={item.primaryImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'}
                  alt={item.productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <button
                onClick={() => toggleWishlist(item.productId)}
                className="absolute top-3 right-3 p-2 bg-white/90 text-rose-500 rounded-full shadow-sm hover:scale-110 transition-transform"
                title="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <Link to={`/products/${item.productSlug}`}>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {item.productName}
                  </h4>
                </Link>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-base font-black text-slate-900">${item.price.toFixed(2)}</span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-xs text-slate-400 line-through">${item.originalPrice.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => addToCart(item.productId, 1)}
                  disabled={item.stockQuantity <= 0}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{item.stockQuantity > 0 ? 'Move to Bag' : 'Out of Stock'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
