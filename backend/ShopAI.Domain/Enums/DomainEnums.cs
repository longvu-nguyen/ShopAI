namespace ShopAI.Domain.Enums;

public enum UserRoleType
{
    Customer = 1,
    Admin = 2
}

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Shipped = 3,
    Delivered = 4,
    Cancelled = 5
}

public enum PaymentStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Refunded = 4
}

public enum PaymentMethod
{
    CashOnDelivery = 1,
    CreditCard = 2,
    MoMo = 3,
    VNPay = 4
}

public enum InventoryTransactionType
{
    InitialStock = 1,
    PurchaseRestock = 2,
    OrderPlaced = 3,
    OrderCancelled = 4,
    ManualAdjustment = 5
}
