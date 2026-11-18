import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorite = isInWishlist(product.id);
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-subtle hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      {/* Thumbnail Area */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Link to={`/products/${product.slug}`} className="block w-full h-full">
          <img
            src={product.primaryImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {discountPercent > 0 && (
            <span className="px-2.5 py-1 bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wide rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2.5 py-1 bg-amber-400 text-slate-900 text-[10px] font-extrabold uppercase tracking-wide rounded-full shadow-sm">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isFavorite
              ? 'bg-rose-50 text-rose-500 border border-rose-200'
              : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'
          }`}
          title={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Overlay on hover for desktop */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
          <button
            onClick={() => addToCart(product.id, 1)}
            disabled={product.stockQuantity <= 0}
            className="w-full py-2.5 px-4 bg-slate-900/90 hover:bg-brand-600 backdrop-blur-md text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{product.stockQuantity > 0 ? 'Quick Add' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
              {product.categoryName}
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.averageRating > 0 ? product.averageRating.toFixed(1) : '5.0'}</span>
              <span className="text-[10px] text-slate-400 font-normal">({product.reviewCount})</span>
            </div>
          </div>

          <Link to={`/products/${product.slug}`} className="block group-hover:text-brand-600 transition-colors">
            <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Bottom Price & Mobile Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Mobile only add button */}
          <button
            onClick={() => addToCart(product.id, 1)}
            disabled={product.stockQuantity <= 0}
            className="sm:hidden p-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
