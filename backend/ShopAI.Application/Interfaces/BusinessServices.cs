using ShopAI.Application.Common;
using ShopAI.Application.DTOs;

namespace ShopAI.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task RevokeTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
}

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CategoryDto> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<CategoryDto> CreateAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default);
    Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetProductsAsync(ProductQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<ProductDetailDto> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductDetailDto> GetProductBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<List<ProductDto>> GetFeaturedProductsAsync(int count = 8, CancellationToken cancellationToken = default);
    Task<List<ProductDto>> GetRelatedProductsAsync(Guid productId, int count = 4, CancellationToken cancellationToken = default);
    Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto, CancellationToken cancellationToken = default);
    Task<ProductDetailDto> UpdateProductAsync(Guid id, UpdateProductDto dto, CancellationToken cancellationToken = default);
    Task DeleteProductAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface ICartService
{
    Task<CartDto> GetCartAsync(Guid? userId, string? guestSessionId, CancellationToken cancellationToken = default);
    Task<CartDto> AddItemAsync(Guid? userId, string? guestSessionId, AddToCartDto dto, CancellationToken cancellationToken = default);
    Task<CartDto> UpdateItemAsync(Guid? userId, string? guestSessionId, UpdateCartItemDto dto, CancellationToken cancellationToken = default);
    Task<CartDto> RemoveItemAsync(Guid? userId, string? guestSessionId, Guid cartItemId, CancellationToken cancellationToken = default);
    Task ClearCartAsync(Guid? userId, string? guestSessionId, CancellationToken cancellationToken = default);
    Task MergeCartAsync(Guid userId, string guestSessionId, CancellationToken cancellationToken = default);
}

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(Guid userId, CreateOrderDto dto, CancellationToken cancellationToken = default);
    Task<PagedResult<OrderDto>> GetMyOrdersAsync(Guid userId, int pageIndex = 1, int pageSize = 10, CancellationToken cancellationToken = default);
    Task<OrderDto> GetOrderByIdAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderDto> GetOrderByNumberAsync(string orderNumber, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<OrderDto> CancelOrderAsync(Guid userId, Guid orderId, string? reason, CancellationToken cancellationToken = default);
    Task<PagedResult<OrderDto>> GetAdminOrdersAsync(OrderQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<OrderDto> UpdateOrderStatusAsync(Guid orderId, UpdateOrderStatusDto dto, CancellationToken cancellationToken = default);
}

public interface IAdminService
{
    Task<AdminDashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default);
    Task<List<InventoryAlertDto>> GetLowStockAlertsAsync(int threshold = 5, CancellationToken cancellationToken = default);
    Task<byte[]> ExportOrdersCsvAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
}

public interface IAiChatService
{
    Task<ChatResponseDto> SendMessageAsync(ChatRequestDto request, Guid? userId, CancellationToken cancellationToken = default);
    Task<ChatSessionDto> GetSessionHistoryAsync(string sessionToken, CancellationToken cancellationToken = default);
}

public interface IReviewService
{
    Task<List<ReviewDto>> GetProductReviewsAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<ReviewDto> AddReviewAsync(Guid userId, CreateReviewDto dto, CancellationToken cancellationToken = default);
}

public interface IWishlistService
{
    Task<List<WishlistDto>> GetUserWishlistAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ToggleWishlistAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default);
    Task<bool> IsInWishlistAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default);
}
