import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  Minus,
  Sparkles,
  Zap
} from 'lucide-react';
import { productsApi, reviewsApi } from '../../services/api';
import { ProductDetail, Product, Review } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ProductCard } from './ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Review Form state
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!slug) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await productsApi.getBySlug(slug);
        if (res.success && res.data) {
          setProduct(res.data);
          const firstImg = res.data.images?.[0]?.imageUrl || res.data.primaryImageUrl || '';
          setActiveImage(firstImg);

          // Fetch reviews and related products in parallel
          const [revRes, relRes] = await Promise.all([
            reviewsApi.getProductReviews(res.data.id),
            productsApi.getRelated(res.data.id, 4),
          ]);

          if (revRes.success && revRes.data) setReviews(revRes.data);
          if (relRes.success && relRes.data) setRelatedProducts(relRes.data);
        }
      } catch (err) {
        console.error('Failed to load product detail', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-6 bg-slate-200 rounded-lg w-1/4" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="mt-6 inline-block px-6 py-2.5 bg-brand-600 text-white rounded-full text-xs font-bold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleBuyNow = async () => {
    const success = await addToCart(product.id, quantity);
    if (success) {
      navigate('/checkout');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to write a review.');
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter review comments.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await reviewsApi.addReview(product.id, newRating, newComment.trim());
      if (res.success && res.data) {
        toast.success('Thank you! Your review has been published.');
        setReviews([res.data, ...reviews]);
        setNewComment('');
        // Refresh product details for updated rating
        const refreshed = await productsApi.getBySlug(slug!);
        if (refreshed.success && refreshed.data) setProduct(refreshed.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit review.';
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/" className="hover:text-slate-700">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-slate-700">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?categorySlug=${product.categoryName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-slate-700">
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Images Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-square rounded-3xl bg-slate-100 overflow-hidden border border-slate-100 shadow-subtle relative group">
            <img
              src={activeImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1.5 bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-md">
                Save {discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-slate-100 ${
                    activeImage === img.imageUrl ? 'border-brand-600 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider">
                {product.categoryName}
              </span>
              <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.averageRating) ? 'fill-current' : 'text-slate-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">
                {product.averageRating > 0 ? product.averageRating.toFixed(1) : '5.0'}
              </span>
              <span className="text-xs text-slate-400">
                ({product.reviewCount} customer reviews)
              </span>
            </div>
          </div>

          {/* Price block */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900">${product.price.toFixed(2)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-base text-slate-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
            {product.stockQuantity > 0 ? (
              <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Stock ({product.stockQuantity} left)
              </span>
            ) : (
              <span className="ml-auto text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Quantity Selector & Purchase Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-subtle">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-slate-50 text-slate-600 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="p-3 hover:bg-slate-50 text-slate-600 transition-colors"
                  disabled={quantity >= product.stockQuantity}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border transition-all ${
                  isFavorite
                    ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-slate-50'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => addToCart(product.id, quantity)}
                disabled={product.stockQuantity <= 0}
                className="py-4 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stockQuantity <= 0}
                className="py-4 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.01]"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-subtle">
              <Truck className="w-4 h-4 text-brand-600 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-800">Free Express</p>
              <p className="text-[9px] text-slate-400">Over $100</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-subtle">
              <RotateCcw className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-800">30-Day Return</p>
              <p className="text-[9px] text-slate-400">Guaranteed</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-subtle">
              <ShieldCheck className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-800">12-Mo Warranty</p>
              <p className="text-[9px] text-slate-400">Official Tech</p>
            </div>
          </div>

        </div>
      </div>

      {/* Description Specifications Tab */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-subtle space-y-6">
        <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
          Detailed Description & Architecture
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {product.description}
        </p>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-subtle space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Customer Reviews</h3>
            <p className="text-xs text-slate-500 mt-1">Verified reviews from authentic deliveries</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-slate-900">
              {product.averageRating > 0 ? product.averageRating.toFixed(1) : '5.0'}
            </span>
            <div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{reviews.length} total reviews</p>
            </div>
          </div>
        </div>

        {/* Add Review Form */}
        <form onSubmit={handleSubmitReview} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/70 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Write a Verified Review</span>
          </h4>

          {/* Star selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Your Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setNewRating(s)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      s <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            placeholder="Share your experience with acoustic performance, durability, design..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={submittingReview}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            {submittingReview ? 'Submitting...' : 'Post Review'}
          </button>
        </form>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No customer reviews yet. Be the first to share!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userName)}&background=437df8&color=fff`}
                      alt={r.userName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{r.userName}</h5>
                      <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {r.isVerifiedPurchase && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Purchase
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {r.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900">Similar Recommended Gear</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
