namespace ShopAI.Domain.Exceptions;

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
    public DomainException(string message, Exception innerException) : base(message, innerException) { }
}

public class NotFoundException : DomainException
{
    public NotFoundException(string entityName, object key)
        : base($"Entity '{entityName}' with key ({key}) was not found.") { }
}

public class InsufficientStockException : DomainException
{
    public string ProductSku { get; }
    public int Available { get; }
    public int Requested { get; }

    public InsufficientStockException(string productName, string sku, int available, int requested)
        : base($"Insufficient stock for '{productName}' (SKU: {sku}). Requested: {requested}, Available: {available}.")
    {
        ProductSku = sku;
        Available = available;
        Requested = requested;
    }
}
