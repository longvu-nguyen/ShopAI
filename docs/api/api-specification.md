# ShopAI - REST API Specifications

The ShopAI Web API exposes standard RESTful endpoints formatted in JSON, secured with JWT Bearer Authentication and governed by RFC 7807 ProblemDetails for error handling.

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new customer account |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive access + refresh token |
| `POST` | `/api/auth/refresh-token` | Public | Rotate refresh token and obtain new access token |
| `POST` | `/api/auth/revoke-token` | Authorized | Invalidate active refresh token |
| `GET` | `/api/auth/me` | Authorized | Get profile details and roles of current user |
| `PUT` | `/api/auth/profile` | Authorized | Update user personal information |
| `POST` | `/api/auth/change-password` | Authorized | Change account password |

---

## 2. Product & Category Endpoints (`/api/products`, `/api/categories`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List categories with product counts |
| `GET` | `/api/categories/{id}` | Public | Get single category |
| `POST` | `/api/categories` | Admin | Create category |
| `PUT` | `/api/categories/{id}` | Admin | Update category details |
| `DELETE` | `/api/categories/{id}` | Admin | Delete empty category |
| `GET` | `/api/products` | Public | Search, filter by price/category/rating, sort, and paginate |
| `GET` | `/api/products/featured` | Public | List handpicked spotlight products |
| `GET` | `/api/products/{id}` | Public | Get product details by GUID |
| `GET` | `/api/products/slug/{slug}` | Public | Get product details by SEO-friendly slug |
| `GET` | `/api/products/{id}/related` | Public | Get related products in same category |
| `POST` | `/api/products` | Admin | Create product and log initial inventory transaction |
| `PUT` | `/api/products/{id}` | Admin | Update product details and adjust stock |
| `DELETE` | `/api/products/{id}` | Admin | Soft-delete or remove product |
| `POST` | `/api/products/upload-image` | Admin | Upload image binary file (JPG, PNG, WebP) |

---

## 3. Cart & Checkout Endpoints (`/api/cart`, `/api/orders`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/cart` | Public / Auth | Get active cart using JWT or `X-Guest-Session-Id` |
| `POST` | `/api/cart/items` | Public / Auth | Add product to bag with stock check |
| `PUT` | `/api/cart/items` | Public / Auth | Update line item quantity |
| `DELETE` | `/api/cart/items/{id}` | Public / Auth | Remove item from cart |
| `DELETE` | `/api/cart/clear` | Public / Auth | Clear shopping bag |
| `POST` | `/api/cart/merge` | Authorized | Merge guest session items into user account upon sign-in |
| `POST` | `/api/orders` | Authorized | Place order under strict database transaction |
| `GET` | `/api/orders/my-orders` | Authorized | View authenticated user's order history |
| `GET` | `/api/orders/{id}` | Authorized | Get single order confirmation details |
| `GET` | `/api/orders/track/{number}` | Public | Public order tracking by order code |
| `POST` | `/api/orders/{id}/cancel` | Authorized | Cancel order and restore inventory |
| `GET` | `/api/orders/admin` | Admin | Filter & paginate all orders across the system |
| `PUT` | `/api/orders/{id}/status` | Admin | Update order status and attach tracking number |

---

## 4. Admin Dashboard Endpoints (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | Admin | Retrieve aggregate KPIs, 7-day revenue, and recent orders |
| `GET` | `/api/admin/inventory/alerts` | Admin | Products with stock quantity <= threshold |
| `GET` | `/api/admin/orders/export-csv` | Admin | Download real CSV report of system orders |

---

## 5. AI Chatbot Endpoints (`/api/ai/chat`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Public / Auth | Send prompt, receive AI response with product cards / tracking |
| `GET` | `/api/ai/chat/history/{token}` | Public / Auth | Retrieve chat message history for session |

---

## 6. Social Engagement (`/api/reviews`, `/api/wishlist`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/reviews/product/{id}` | Public | Get verified reviews for a product |
| `POST` | `/api/reviews` | Authorized | Submit review with verified purchase validation |
| `GET` | `/api/wishlist` | Authorized | List customer's saved products |
| `POST` | `/api/wishlist/toggle/{id}` | Authorized | Toggle product in/out of wishlist |
| `GET` | `/api/wishlist/check/{id}` | Authorized | Check if product is favorited |
