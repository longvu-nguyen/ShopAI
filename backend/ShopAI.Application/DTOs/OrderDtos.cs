using ShopAI.Domain.Enums;

namespace ShopAI.Application.DTOs;

public record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSku,
    string? ProductImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice
);

public record PaymentDto(
    Guid Id,
    decimal Amount,
    PaymentMethod Method,
    PaymentStatus Status,
    string? TransactionCode,
    DateTime? PaymentDate
);

public record OrderDto(
    Guid Id,
    string OrderNumber,
    Guid UserId,
    string UserEmail,
    string RecipientName,
    string PhoneNumber,
    string ShippingAddress,
    OrderStatus Status,
    decimal Subtotal,
    decimal ShippingFee,
    decimal DiscountAmount,
    decimal TotalAmount,
    string? Notes,
    string? TrackingNumber,
    PaymentDto? Payment,
    List<OrderItemDto> Items,
    DateTime CreatedAt
);

public record CreateOrderDto(
    string RecipientName,
    string PhoneNumber,
    string ShippingAddress,
    PaymentMethod PaymentMethod,
    string? Notes,
    List<CreateOrderItemDto>? DirectItems = null // If null, uses active cart
);

public record CreateOrderItemDto(
    Guid ProductId,
    int Quantity
);

public record UpdateOrderStatusDto(
    OrderStatus Status,
    string? TrackingNumber
);

public class OrderQueryParameters
{
    public OrderStatus? Status { get; set; }
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
