# ShopAI - System Architecture Documentation

## 1. Architectural Style: Modular Monolith with Clean Architecture
ShopAI is structured as a **Modular Monolith** applying **Clean Architecture (Onion Architecture)** principles. This architectural choice delivers:
- Clear separation of concerns without the distributed systems overhead, latency, and operational complexity of microservices.
- High testability: Domain and business rules are decoupled from external frameworks, persistence mechanisms, and UI.
- Direct path for extraction into microservices or serverless functions if scale demands it in the future.

```
                      ┌──────────────────────────────────────────────┐
                      │              ShopAI.Api Layer                │
                      │  - Controllers & Routes                      │
                      │  - Global Exception Handling (RFC 7807)      │
                      │  - Security Headers & Fixed Rate Limiter     │
                      │  - Swagger / OpenAPI Specification           │
                      └──────────────────────┬───────────────────────┘
                                             │
                      ┌──────────────────────▼───────────────────────┐
                      │          ShopAI.Application Layer            │
                      │  - Application Interfaces & Contracts        │
                      │  - Business Services Orchestration           │
                      │  - DTOs & Response Envelopes                 │
                      │  - FluentValidation Rules                    │
                      └──────────────┬───────────────────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
┌─────────────▼────────────────┐             ┌──────────────▼──────────────┐
│     ShopAI.Domain Layer      │             │ ShopAI.Infrastructure Layer │
│ - Core Domain Entities       │◄────────────┤ - EF Core DbContext         │
│ - Enums & Status Models      │             │ - PostgreSQL Migration      │
│ - Domain Exceptions          │             │ - BCrypt Password Hasher    │
│ - Zero External Dependencies │             │ - JWT & Token Rotation      │
└──────────────────────────────┘             │ - AI Chatbot Advisor        │
                                             │ - File Storage System       │
                                             └─────────────────────────────┘
```

---

## 2. Layer Responsibilities

### 2.1 ShopAI.Domain (Core)
- **Role**: Contains enterprise business logic, entity models, and domain exceptions.
- **Dependencies**: Pure C# without external library dependencies (`BaseEntity`, `Order`, `Product`, `User`, `Cart`, `InventoryTransaction`).
- **Invariants & Domain Exceptions**: Enforces business rules (e.g. `InsufficientStockException`, `DomainException`).

### 2.2 ShopAI.Application
- **Role**: Defines business workflows, use cases, and interfaces.
- **Components**:
  - `IApplicationDbContext`: Abstraction over data access.
  - `IOrderService`, `IProductService`, `IAuthService`, `IAiChatService`: Domain orchestrators.
  - `FluentValidation`: Declarative request validation pipelines.
  - `ApiResponse<T>` & `PagedResult<T>`: Standardized response envelopes.

### 2.3 ShopAI.Infrastructure
- **Role**: Implements interfaces with concrete technical details.
- **Persistence**: PostgreSQL via Entity Framework Core 8 with Fluent API configuration.
- **Security**: BCrypt with work factor 11 for password hashing; cryptographic HMAC-SHA256 for JWT tokens.
- **Audit Logging**: `InventoryTransaction` tracking for every order placement, cancellation, or restocking event.
- **AI Engine**: Intelligent rule & semantic assistant with product recommendation cards and real-time order tracking integration.

### 2.4 ShopAI.Api
- **Role**: HTTP Host and boundary layer.
- **Cross-cutting concerns**:
  - `GlobalExceptionHandlingMiddleware`: Centralized error handling generating RFC 7807 ProblemDetails.
  - `SecurityHeadersMiddleware`: Sets OWASP recommended defense-in-depth headers.
  - `RateLimiter`: Sliding/fixed window limits to prevent DDoS and brute-force attacks.
  - Automated database migration and rich initial dataset seeding upon startup (`DbInitializer.SeedAsync`).

---

## 3. Key Technical Mechanisms

### 3.1 Anti-Overselling Transaction Pattern
To eliminate race conditions and overselling during simultaneous checkout attempts:
1. `OrderService.CreateOrderAsync` begins an explicit database transaction (`BeginTransactionAsync`).
2. Current stock for each product in the order is checked within the transaction boundary.
3. If any item has `StockQuantity < Requested`, an `InsufficientStockException` is thrown, triggering a rollback.
4. Stock quantities are decremented and an `InventoryTransaction` record is written with audit details.
5. The order and payment records are saved and committed atomically.
6. If an order is subsequently cancelled, stock is restored with an audit transaction of type `OrderCancelled`.

### 3.2 JWT Access & Refresh Token Rotation
- **Access Tokens**: Short-lived (60 minutes) containing sub, email, roles, and a unique `jti`.
- **Refresh Tokens**: Cryptographically secure 64-byte tokens stored in PostgreSQL with `IsUsed`, `IsRevoked`, and `ExpiryDate`.
- **Rotation**: When a refresh token is exchanged, it is immediately marked as `IsUsed = true`. A brand new access token and refresh token are generated. Any attempt to reuse a consumed token revokes the session, protecting against replay attacks.

### 3.3 AI Customer Support Engine
- **Intent Recognition**:
  - Order Tracking: Matches `ORD-YYYYMMDD-XXXXX` regex to retrieve live order status, carrier tracking codes, and item breakdowns.
  - Product Advisory: Matches keywords across categories to query database products, returning structured recommendation objects.
  - Policy FAQ: Provides instant answers for shipping, 30-day returns, warranty, and accepted payments.
- **Frontend Integration**: Emits rich product cards within chat messages that users can click to inspect or add directly to their cart.
