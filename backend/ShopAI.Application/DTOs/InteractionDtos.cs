namespace ShopAI.Application.DTOs;

public record ReviewDto(
    Guid Id,
    Guid ProductId,
    Guid UserId,
    string UserName,
    string? UserAvatar,
    int Rating,
    string Comment,
    bool IsVerifiedPurchase,
    DateTime CreatedAt
);

public record CreateReviewDto(
    Guid ProductId,
    int Rating,
    string Comment
);

public record WishlistDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    decimal Price,
    decimal? OriginalPrice,
    int StockQuantity,
    string? PrimaryImageUrl,
    DateTime AddedAt
);
