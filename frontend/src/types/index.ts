export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roles: string[];
  createdAt: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  productCount: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  primaryImageUrl?: string;
  createdAt: string;
}

export interface ProductDetail extends Product {
  description: string;
  images: ProductImage[];
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productSku: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 1 | 2 | 3 | 4; // 1: COD, 2: CreditCard, 3: MoMo, 4: VNPay
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface PaymentInfo {
  id: string;
  amount: number;
  method: string | number;
  status: PaymentStatus;
  transactionCode?: string;
  paymentDate?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  trackingNumber?: string;
  payment?: PaymentInfo;
  items: OrderItem[];
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  primaryImageUrl?: string;
  addedAt: string;
}

export interface ChatProductRecommendation {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  shortDescription: string;
  rating: number;
}

export interface ChatMessage {
  id: string;
  sender: 'User' | 'Assistant';
  message: string;
  metadataJson?: string;
  recommendedProducts?: ChatProductRecommendation[];
  createdAt: string;
}

export interface AdminMetrics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProductCount: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }[];
  revenueOverTime: {
    date: string;
    revenue: number;
    orderCount: number;
  }[];
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
}
