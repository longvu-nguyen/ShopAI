import axios from 'axios';
import {
  ApiResponse,
  AuthResponse,
  UserProfile,
  Category,
  Product,
  ProductDetail,
  PagedResult,
  Cart,
  Order,
  Review,
  WishlistItem,
  AdminMetrics,
  InventoryAlert,
  ChatProductRecommendation
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for guest session id
export const getGuestSessionId = (): string => {
  let sessionId = localStorage.getItem('shopai_guest_session');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('shopai_guest_session', sessionId);
  }
  return sessionId;
};

// Request Interceptor: Attach JWT Token & Guest Session
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopai_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Guest-Session-Id'] = getGuestSessionId();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Refresh Token rotation on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('shopai_refresh_token');
      const accessToken = localStorage.getItem('shopai_access_token');

      if (refreshToken && accessToken) {
        try {
          const res = await axios.post<ApiResponse<AuthResponse>>('/api/auth/refresh-token', {
            accessToken,
            refreshToken,
          });

          if (res.data.success) {
            localStorage.setItem('shopai_access_token', res.data.data.accessToken);
            localStorage.setItem('shopai_refresh_token', res.data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('shopai_access_token');
          localStorage.removeItem('shopai_refresh_token');
          localStorage.removeItem('shopai_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string }) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get<ApiResponse<UserProfile>>('/auth/me');
    return res.data;
  },
  updateProfile: async (data: { firstName: string; lastName: string; phoneNumber?: string; avatarUrl?: string }) => {
    const res = await api.put<ApiResponse<UserProfile>>('/auth/profile', data);
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post<ApiResponse<string>>('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

export const categoriesApi = {
  getAll: async (includeInactive = false) => {
    const res = await api.get<ApiResponse<Category[]>>('/categories', { params: { includeInactive } });
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await api.get<ApiResponse<Category>>(`/categories/slug/${slug}`);
    return res.data;
  },
  create: async (data: { name: string; description?: string; imageUrl?: string; displayOrder: number }) => {
    const res = await api.post<ApiResponse<Category>>('/categories', data);
    return res.data;
  },
  update: async (id: string, data: { name: string; description?: string; imageUrl?: string; isActive: boolean; displayOrder: number }) => {
    const res = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<string>>(`/categories/${id}`);
    return res.data;
  },
};

export const productsApi = {
  getProducts: async (params: {
    search?: string;
    categoryId?: string;
    categorySlug?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStockOnly?: boolean;
    featuredOnly?: boolean;
    sortBy?: string;
    pageIndex?: number;
    pageSize?: number;
  }) => {
    const res = await api.get<ApiResponse<PagedResult<Product>>>('/products', { params });
    return res.data;
  },
  getFeatured: async (count = 8) => {
    const res = await api.get<ApiResponse<Product[]>>('/products/featured', { params: { count } });
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await api.get<ApiResponse<ProductDetail>>(`/products/slug/${slug}`);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<ProductDetail>>(`/products/${id}`);
    return res.data;
  },
  getRelated: async (id: string, count = 4) => {
    const res = await api.get<ApiResponse<Product[]>>(`/products/${id}/related`, { params: { count } });
    return res.data;
  },
  create: async (data: {
    categoryId: string;
    name: string;
    sku: string;
    shortDescription: string;
    description: string;
    price: number;
    originalPrice?: number;
    stockQuantity: number;
    isFeatured: boolean;
    imageUrls?: string[];
  }) => {
    const res = await api.post<ApiResponse<ProductDetail>>('/products', data);
    return res.data;
  },
  update: async (id: string, data: {
    categoryId: string;
    name: string;
    sku: string;
    shortDescription: string;
    description: string;
    price: number;
    originalPrice?: number;
    stockQuantity: number;
    isActive: boolean;
    isFeatured: boolean;
    imageUrls?: string[];
  }) => {
    const res = await api.put<ApiResponse<ProductDetail>>(`/products/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<string>>(`/products/${id}`);
    return res.data;
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<string>>('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const cartApi = {
  getCart: async () => {
    const res = await api.get<ApiResponse<Cart>>('/cart');
    return res.data;
  },
  addItem: async (productId: string, quantity: number) => {
    const res = await api.post<ApiResponse<Cart>>('/cart/items', { productId, quantity });
    return res.data;
  },
  updateItem: async (cartItemId: string, quantity: number) => {
    const res = await api.put<ApiResponse<Cart>>('/cart/items', { cartItemId, quantity });
    return res.data;
  },
  removeItem: async (cartItemId: string) => {
    const res = await api.delete<ApiResponse<Cart>>(`/cart/items/${cartItemId}`);
    return res.data;
  },
  clear: async () => {
    const res = await api.delete<ApiResponse<string>>('/cart/clear');
    return res.data;
  },
  merge: async (guestSessionId: string) => {
    const res = await api.post<ApiResponse<string>>('/cart/merge', JSON.stringify(guestSessionId));
    return res.data;
  },
};

export const ordersApi = {
  createOrder: async (data: {
    recipientName: string;
    phoneNumber: string;
    shippingAddress: string;
    paymentMethod: number;
    notes?: string;
    directItems?: { productId: string; quantity: number }[];
  }) => {
    const res = await api.post<ApiResponse<Order>>('/orders', data);
    return res.data;
  },
  getMyOrders: async (pageIndex = 1, pageSize = 10) => {
    const res = await api.get<ApiResponse<PagedResult<Order>>>('/orders/my-orders', { params: { pageIndex, pageSize } });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data;
  },
  trackOrder: async (orderNumber: string) => {
    const res = await api.get<ApiResponse<Order>>(`/orders/track/${orderNumber}`);
    return res.data;
  },
  cancelOrder: async (id: string, reason?: string) => {
    const res = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`, JSON.stringify(reason || ''));
    return res.data;
  },
  getAdminOrders: async (params: {
    status?: number;
    search?: string;
    fromDate?: string;
    toDate?: string;
    pageIndex?: number;
    pageSize?: number;
  }) => {
    const res = await api.get<ApiResponse<PagedResult<Order>>>('/orders/admin', { params });
    return res.data;
  },
  updateStatus: async (id: string, status: number, trackingNumber?: string) => {
    const res = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, { status, trackingNumber });
    return res.data;
  },
};

export const adminApi = {
  getMetrics: async () => {
    const res = await api.get<ApiResponse<AdminMetrics>>('/admin/metrics');
    return res.data;
  },
  getLowStockAlerts: async (threshold = 5) => {
    const res = await api.get<ApiResponse<InventoryAlert[]>>('/admin/inventory/alerts', { params: { threshold } });
    return res.data;
  },
  exportCsv: async (fromDate?: string, toDate?: string) => {
    const res = await api.get('/admin/orders/export-csv', {
      params: { fromDate, toDate },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShopAI_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

export const aiChatApi = {
  sendMessage: async (message: string, sessionToken?: string) => {
    const res = await api.post<ApiResponse<{
      sessionToken: string;
      reply: string;
      recommendedProducts?: ChatProductRecommendation[];
      orderLookupSummary?: string;
      timestamp: string;
    }>>('/ai/chat', { message, sessionToken });
    return res.data;
  },
  getHistory: async (sessionToken: string) => {
    const res = await api.get<ApiResponse<{
      id: string;
      sessionToken: string;
      createdAt: string;
      messages: {
        id: string;
        sender: 'User' | 'Assistant';
        message: string;
        metadataJson?: string;
        createdAt: string;
      }[];
    }>>(`/ai/chat/history/${sessionToken}`);
    return res.data;
  },
};

export const reviewsApi = {
  getProductReviews: async (productId: string) => {
    const res = await api.get<ApiResponse<Review[]>>(`/reviews/product/${productId}`);
    return res.data;
  },
  addReview: async (productId: string, rating: number, comment: string) => {
    const res = await api.post<ApiResponse<Review>>('/reviews', { productId, rating, comment });
    return res.data;
  },
};

export const wishlistApi = {
  getWishlist: async () => {
    const res = await api.get<ApiResponse<WishlistItem[]>>('/wishlist');
    return res.data;
  },
  toggleWishlist: async (productId: string) => {
    const res = await api.post<ApiResponse<boolean>>(`/wishlist/toggle/${productId}`);
    return res.data;
  },
  checkWishlist: async (productId: string) => {
    const res = await api.get<ApiResponse<boolean>>(`/wishlist/check/${productId}`);
    return res.data;
  },
};

export default api;
