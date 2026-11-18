using Microsoft.EntityFrameworkCore;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Exceptions;

namespace ShopAI.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly IApplicationDbContext _context;

    public CartService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CartDto> GetCartAsync(Guid? userId, string? guestSessionId, CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCartInternalAsync(userId, guestSessionId, cancellationToken);
        return MapToDto(cart);
    }

    public async Task<CartDto> AddItemAsync(Guid? userId, string? guestSessionId, AddToCartDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.Quantity <= 0)
        {
            throw new DomainException("Quantity must be greater than zero.");
        }

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId && p.IsActive, cancellationToken);

        if (product == null)
        {
            throw new NotFoundException(nameof(Product), dto.ProductId);
        }

        var cart = await GetOrCreateCartInternalAsync(userId, guestSessionId, cancellationToken);

        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == dto.ProductId);
        var desiredQuantity = (existingItem?.Quantity ?? 0) + dto.Quantity;

        if (desiredQuantity > product.StockQuantity)
        {
            throw new InsufficientStockException(product.Name, product.Sku, product.StockQuantity, desiredQuantity);
        }

        if (existingItem != null)
        {
            existingItem.Quantity = desiredQuantity;
            existingItem.UnitPrice = product.Price;
            existingItem.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var newItem = new CartItem
            {
                CartId = cart.Id,
                ProductId = product.Id,
                Quantity = dto.Quantity,
                UnitPrice = product.Price
            };
            cart.Items.Add(newItem);
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await GetCartAsync(userId, guestSessionId, cancellationToken);
    }

    public async Task<CartDto> UpdateItemAsync(Guid? userId, string? guestSessionId, UpdateCartItemDto dto, CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCartInternalAsync(userId, guestSessionId, cancellationToken);
        var item = cart.Items.FirstOrDefault(i => i.Id == dto.CartItemId);

        if (item == null)
        {
            throw new NotFoundException(nameof(CartItem), dto.CartItemId);
        }

        if (dto.Quantity <= 0)
        {
            cart.Items.Remove(item);
            _context.CartItems.Remove(item);
        }
        else
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId, cancellationToken);
            if (product != null && dto.Quantity > product.StockQuantity)
            {
                throw new InsufficientStockException(product.Name, product.Sku, product.StockQuantity, dto.Quantity);
            }

            item.Quantity = dto.Quantity;
            if (product != null)
            {
                item.UnitPrice = product.Price;
            }
            item.UpdatedAt = DateTime.UtcNow;
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await GetCartAsync(userId, guestSessionId, cancellationToken);
    }

    public async Task<CartDto> RemoveItemAsync(Guid? userId, string? guestSessionId, Guid cartItemId, CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCartInternalAsync(userId, guestSessionId, cancellationToken);
        var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId);

        if (item != null)
        {
            cart.Items.Remove(item);
            _context.CartItems.Remove(item);
            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return await GetCartAsync(userId, guestSessionId, cancellationToken);
    }

    public async Task ClearCartAsync(Guid? userId, string? guestSessionId, CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCartInternalAsync(userId, guestSessionId, cancellationToken);
        if (cart.Items.Any())
        {
            _context.CartItems.RemoveRange(cart.Items);
            cart.Items.Clear();
            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MergeCartAsync(Guid userId, string guestSessionId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(guestSessionId)) return;

        var guestCart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.GuestSessionId == guestSessionId, cancellationToken);

        if (guestCart == null || !guestCart.Items.Any()) return;

        var userCart = await GetOrCreateCartInternalAsync(userId, null, cancellationToken);

        foreach (var guestItem in guestCart.Items)
        {
            var existingUserItem = userCart.Items.FirstOrDefault(i => i.ProductId == guestItem.ProductId);
            if (existingUserItem != null)
            {
                existingUserItem.Quantity += guestItem.Quantity;
            }
            else
            {
                userCart.Items.Add(new CartItem
                {
                    CartId = userCart.Id,
                    ProductId = guestItem.ProductId,
                    Quantity = guestItem.Quantity,
                    UnitPrice = guestItem.UnitPrice
                });
            }
        }

        _context.Carts.Remove(guestCart);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Cart> GetOrCreateCartInternalAsync(Guid? userId, string? guestSessionId, CancellationToken cancellationToken)
    {
        Cart? cart = null;

        if (userId.HasValue)
        {
            cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                .ThenInclude(p => p.Images)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value, cancellationToken);

            if (cart == null)
            {
                cart = new Cart { UserId = userId.Value };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
        else if (!string.IsNullOrWhiteSpace(guestSessionId))
        {
            cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                .ThenInclude(p => p.Images)
                .FirstOrDefaultAsync(c => c.GuestSessionId == guestSessionId, cancellationToken);

            if (cart == null)
            {
                cart = new Cart { GuestSessionId = guestSessionId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
        else
        {
            throw new DomainException("Either UserId or GuestSessionId must be provided.");
        }

        return cart;
    }

    private static CartDto MapToDto(Cart cart)
    {
        var items = cart.Items.Select(i => new CartItemDto(
            i.Id,
            i.ProductId,
            i.Product?.Name ?? "Product",
            i.Product?.Slug ?? "",
            i.Product?.Sku ?? "",
            i.Product?.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault(),
            i.UnitPrice,
            i.Quantity,
            i.Product?.StockQuantity ?? 0,
            i.UnitPrice * i.Quantity
        )).ToList();

        var subtotal = items.Sum(i => i.TotalPrice);

        return new CartDto(
            cart.Id,
            items,
            items.Sum(i => i.Quantity),
            subtotal
        );
    }
}
