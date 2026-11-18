namespace ShopAI.Application.DTOs;

public record AdminDashboardMetricsDto(
    int TotalOrders,
    int PendingOrders,
    int CompletedOrders,
    decimal TotalRevenue,
    decimal TodayRevenue,
    int TotalCustomers,
    int TotalProducts,
    int LowStockProductCount,
    List<RecentOrderDto> RecentOrders,
    List<RevenueDataPointDto> RevenueOverTime
);

public record RecentOrderDto(
    Guid Id,
    string OrderNumber,
    string CustomerName,
    decimal TotalAmount,
    string Status,
    DateTime CreatedAt
);

public record RevenueDataPointDto(
    string Date,
    decimal Revenue,
    int OrderCount
);

public record InventoryAlertDto(
    Guid ProductId,
    string ProductName,
    string Sku,
    int CurrentStock,
    int Threshold
);

public record InventoryTransactionDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string Sku,
    string Type,
    int QuantityChange,
    int QuantityAfter,
    string? Reason,
    DateTime CreatedAt
);
