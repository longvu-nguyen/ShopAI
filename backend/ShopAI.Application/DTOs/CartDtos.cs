namespace ShopAI.Application.DTOs;

public record CartItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string ProductSku,
    string? ProductImageUrl,
    decimal UnitPrice,
    int Quantity,
    int AvailableStock,
    decimal TotalPrice
);

public record CartDto(
    Guid Id,
    List<CartItemDto> Items,
    int TotalItems,
    decimal Subtotal
);

public record AddToCartDto(
    Guid ProductId,
    int Quantity
);

public record UpdateCartItemDto(
    Guid CartItemId,
    int Quantity
);
