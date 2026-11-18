using Microsoft.EntityFrameworkCore;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Enums;
using ShopAI.Domain.Exceptions;

namespace ShopAI.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly IApplicationDbContext _context;

    public ReviewService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReviewDto>> GetProductReviewsAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.ProductId == productId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto(
                r.Id,
                r.ProductId,
                r.UserId,
                r.User.FullName,
                r.User.AvatarUrl,
                r.Rating,
                r.Comment,
                r.IsVerifiedPurchase,
                r.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<ReviewDto> AddReviewAsync(Guid userId, CreateReviewDto dto, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId, cancellationToken);
        if (product == null)
        {
            throw new NotFoundException(nameof(Product), dto.ProductId);
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException(nameof(User), userId);
        }

        // Check if user already reviewed this product
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ProductId == dto.ProductId && r.UserId == userId, cancellationToken);

        if (existingReview != null)
        {
            throw new DomainException("You have already reviewed this product.");
        }

        // Check verified purchase: user has completed/delivered or confirmed order containing this product
        var isVerified = await _context.Orders
            .Where(o => o.UserId == userId && o.Status != OrderStatus.Cancelled)
            .AnyAsync(o => o.Items.Any(i => i.ProductId == dto.ProductId), cancellationToken);

        var review = new Review
        {
            ProductId = dto.ProductId,
            UserId = userId,
            Rating = Math.Clamp(dto.Rating, 1, 5),
            Comment = dto.Comment.Trim(),
            IsApproved = true,
            IsVerifiedPurchase = isVerified
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);

        // Recalculate average rating & review count for product
        var allReviews = await _context.Reviews
            .Where(r => r.ProductId == dto.ProductId && r.IsApproved)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);

        product.ReviewCount = allReviews.Count;
        product.AverageRating = allReviews.Any() ? Math.Round(allReviews.Average(), 1) : 0;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new ReviewDto(
            review.Id,
            review.ProductId,
            review.UserId,
            user.FullName,
            user.AvatarUrl,
            review.Rating,
            review.Comment,
            review.IsVerifiedPurchase,
            review.CreatedAt
        );
    }
}

public class WishlistService : IWishlistService
{
    private readonly IApplicationDbContext _context;

    public WishlistService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<WishlistDto>> GetUserWishlistAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Wishlists
            .AsNoTracking()
            .Include(w => w.Product)
            .ThenInclude(p => p.Images)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WishlistDto(
                w.Id,
                w.ProductId,
                w.Product.Name,
                w.Product.Slug,
                w.Product.Price,
                w.Product.OriginalPrice,
                w.Product.StockQuantity,
                w.Product.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault(),
                w.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ToggleWishlistAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId, cancellationToken);

        if (existing != null)
        {
            _context.Wishlists.Remove(existing);
            await _context.SaveChangesAsync(cancellationToken);
            return false; // Removed
        }
        else
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == productId, cancellationToken);
            if (!productExists)
            {
                throw new NotFoundException(nameof(Product), productId);
            }

            var wishlist = new Wishlist
            {
                UserId = userId,
                ProductId = productId
            };
            _context.Wishlists.Add(wishlist);
            await _context.SaveChangesAsync(cancellationToken);
            return true; // Added
        }
    }

    public async Task<bool> IsInWishlistAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default)
    {
        return await _context.Wishlists
            .AnyAsync(w => w.UserId == userId && w.ProductId == productId, cancellationToken);
    }
}
