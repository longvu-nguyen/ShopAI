using Microsoft.EntityFrameworkCore;
using ShopAI.Application.Common;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Enums;
using ShopAI.Domain.Exceptions;

namespace ShopAI.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IApplicationDbContext _context;

    public OrderService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDto> CreateOrderAsync(Guid userId, CreateOrderDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException(nameof(User), userId);
        }

        // Determine items to order: from direct items or from user's cart
        var itemsToOrder = new List<(Guid ProductId, int Quantity)>();

        if (dto.DirectItems != null && dto.DirectItems.Any())
        {
            itemsToOrder = dto.DirectItems.Select(i => (i.ProductId, i.Quantity)).ToList();
        }
        else
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

            if (cart == null || !cart.Items.Any())
            {
                throw new DomainException("Cannot create order from an empty cart.");
            }

            itemsToOrder = cart.Items.Select(i => (i.ProductId, i.Quantity)).ToList();
        }

        // Run entire checkout in a transactional boundary to prevent overselling!
        using var transaction = await _context.BeginTransactionAsync(cancellationToken);
        try
        {
            var productIds = itemsToOrder.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Include(p => p.Images)
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            var order = new Order
            {
                OrderNumber = GenerateOrderNumber(),
                UserId = userId,
                RecipientName = dto.RecipientName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                ShippingAddress = dto.ShippingAddress.Trim(),
                Status = OrderStatus.Pending,
                Notes = dto.Notes?.Trim()
            };

            decimal subtotal = 0;

            foreach (var item in itemsToOrder)
            {
                var product = products.FirstOrDefault(p => p.Id == item.ProductId);
                if (product == null || !product.IsActive)
                {
                    throw new DomainException($"Product with ID '{item.ProductId}' is no longer available.");
                }

                if (product.StockQuantity < item.Quantity)
                {
                    throw new InsufficientStockException(product.Name, product.Sku, product.StockQuantity, item.Quantity);
                }

                // Deduct stock
                product.StockQuantity -= item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;

                var lineTotal = product.Price * item.Quantity;
                subtotal += lineTotal;

                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = product.Id,
                    ProductName = product.Name,
                    ProductSku = product.Sku,
                    ProductImageUrl = product.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault(),
                    UnitPrice = product.Price,
                    Quantity = item.Quantity,
                    TotalPrice = lineTotal
                };
                order.Items.Add(orderItem);

                // Audit inventory transaction
                var inventoryTx = new InventoryTransaction
                {
                    ProductId = product.Id,
                    Order = order,
                    Type = InventoryTransactionType.OrderPlaced,
                    QuantityChange = -item.Quantity,
                    QuantityAfter = product.StockQuantity,
                    Reason = $"Order placed {order.OrderNumber}"
                };
                _context.InventoryTransactions.Add(inventoryTx);
            }

            // Calculation
            decimal shippingFee = subtotal >= 100 ? 0 : 10.00m; // Free shipping over $100
            order.Subtotal = subtotal;
            order.ShippingFee = shippingFee;
            order.DiscountAmount = 0;
            order.TotalAmount = subtotal + shippingFee;

            // Payment record
            var payment = new Payment
            {
                OrderId = order.Id,
                Amount = order.TotalAmount,
                Method = dto.PaymentMethod,
                Status = dto.PaymentMethod == PaymentMethod.CashOnDelivery ? PaymentStatus.Pending : PaymentStatus.Completed,
                TransactionCode = $"TXN-{Guid.NewGuid():N}"[..18].ToUpperInvariant(),
                PaymentDate = dto.PaymentMethod == PaymentMethod.CashOnDelivery ? null : DateTime.UtcNow
            };
            order.Payment = payment;

            _context.Orders.Add(order);

            // If checked out from cart, clear cart
            var userCart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);
            if (userCart != null && userCart.Items.Any())
            {
                _context.CartItems.RemoveRange(userCart.Items);
                userCart.Items.Clear();
                userCart.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return await GetOrderByIdAsync(userId, order.Id, cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<PagedResult<OrderDto>> GetMyOrdersAsync(Guid userId, int pageIndex = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        pageIndex = Math.Max(1, pageIndex);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var orders = await query
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = orders.Select(MapToDto).ToList();
        return new PagedResult<OrderDto>(dtos, total, pageIndex, pageSize);
    }

    public async Task<OrderDto> GetOrderByIdAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null)
        {
            throw new NotFoundException(nameof(Order), orderId);
        }

        // Verify owner if not admin
        if (order.UserId != userId)
        {
            var isUserAdmin = await _context.UserRoles
                .AnyAsync(ur => ur.UserId == userId && ur.Role.Name == UserRoleType.Admin.ToString(), cancellationToken);
            if (!isUserAdmin)
            {
                throw new DomainException("You do not have permission to view this order.");
            }
        }

        return MapToDto(order);
    }

    public async Task<OrderDto> GetOrderByNumberAsync(string orderNumber, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        var cleanNumber = orderNumber.Trim().ToUpperInvariant();
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .Where(o => o.OrderNumber == cleanNumber);

        if (userId.HasValue)
        {
            query = query.Where(o => o.UserId == userId.Value);
        }

        var order = await query.FirstOrDefaultAsync(cancellationToken);
        if (order == null)
        {
            throw new NotFoundException(nameof(Order), orderNumber);
        }

        return MapToDto(order);
    }

    public async Task<OrderDto> CancelOrderAsync(Guid userId, Guid orderId, string? reason, CancellationToken cancellationToken = default)
    {
        using var transaction = await _context.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

            if (order == null)
            {
                throw new NotFoundException(nameof(Order), orderId);
            }

            var isUserAdmin = await _context.UserRoles
                .AnyAsync(ur => ur.UserId == userId && ur.Role.Name == UserRoleType.Admin.ToString(), cancellationToken);

            if (order.UserId != userId && !isUserAdmin)
            {
                throw new DomainException("You do not have permission to cancel this order.");
            }

            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Confirmed)
            {
                throw new DomainException($"Cannot cancel order in '{order.Status}' status.");
            }

            order.Status = OrderStatus.Cancelled;
            order.Notes = string.IsNullOrWhiteSpace(order.Notes)
                ? $"Cancelled: {reason}"
                : $"{order.Notes} | Cancelled: {reason}";
            order.UpdatedAt = DateTime.UtcNow;

            if (order.Payment != null && order.Payment.Status == PaymentStatus.Completed)
            {
                order.Payment.Status = PaymentStatus.Refunded;
                order.Payment.UpdatedAt = DateTime.UtcNow;
            }

            // Restore stock
            var productIds = order.Items.Select(i => i.ProductId).ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            foreach (var item in order.Items)
            {
                var prod = products.FirstOrDefault(p => p.Id == item.ProductId);
                if (prod != null)
                {
                    prod.StockQuantity += item.Quantity;
                    prod.UpdatedAt = DateTime.UtcNow;

                    _context.InventoryTransactions.Add(new InventoryTransaction
                    {
                        ProductId = prod.Id,
                        OrderId = order.Id,
                        Type = InventoryTransactionType.OrderCancelled,
                        QuantityChange = item.Quantity,
                        QuantityAfter = prod.StockQuantity,
                        Reason = $"Restock from cancelled order {order.OrderNumber}"
                    });
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return await GetOrderByIdAsync(userId, order.Id, cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<PagedResult<OrderDto>> GetAdminOrdersAsync(OrderQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .AsQueryable();

        if (parameters.Status.HasValue)
        {
            query = query.Where(o => o.Status == parameters.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim().ToLower();
            query = query.Where(o => o.OrderNumber.ToLower().Contains(search)
                                  || o.RecipientName.ToLower().Contains(search)
                                  || o.PhoneNumber.Contains(search)
                                  || o.User.Email.ToLower().Contains(search));
        }

        if (parameters.FromDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt >= parameters.FromDate.Value);
        }

        if (parameters.ToDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt <= parameters.ToDate.Value);
        }

        query = query.OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var pageIndex = Math.Max(1, parameters.PageIndex);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);

        var orders = await query
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = orders.Select(MapToDto).ToList();
        return new PagedResult<OrderDto>(dtos, total, pageIndex, pageSize);
    }

    public async Task<OrderDto> UpdateOrderStatusAsync(Guid orderId, UpdateOrderStatusDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null)
        {
            throw new NotFoundException(nameof(Order), orderId);
        }

        order.Status = dto.Status;
        if (!string.IsNullOrWhiteSpace(dto.TrackingNumber))
        {
            order.TrackingNumber = dto.TrackingNumber.Trim();
        }

        if (dto.Status == OrderStatus.Delivered && order.Payment != null && order.Payment.Status == PaymentStatus.Pending)
        {
            order.Payment.Status = PaymentStatus.Completed;
            order.Payment.PaymentDate = DateTime.UtcNow;
        }

        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(order);
    }

    private static string GenerateOrderNumber()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = new Random().Next(10000, 99999);
        return $"ORD-{datePart}-{randomPart}";
    }

    private static OrderDto MapToDto(Order o)
    {
        return new OrderDto(
            o.Id,
            o.OrderNumber,
            o.UserId,
            o.User?.Email ?? "",
            o.RecipientName,
            o.PhoneNumber,
            o.ShippingAddress,
            o.Status,
            o.Subtotal,
            o.ShippingFee,
            o.DiscountAmount,
            o.TotalAmount,
            o.Notes,
            o.TrackingNumber,
            o.Payment != null ? new PaymentDto(
                o.Payment.Id,
                o.Payment.Amount,
                o.Payment.Method,
                o.Payment.Status,
                o.Payment.TransactionCode,
                o.Payment.PaymentDate
            ) : null,
            o.Items.Select(i => new OrderItemDto(
                i.Id,
                i.ProductId,
                i.ProductName,
                i.ProductSku,
                i.ProductImageUrl,
                i.UnitPrice,
                i.Quantity,
                i.TotalPrice
            )).ToList(),
            o.CreatedAt
        );
    }
}
