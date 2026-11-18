using Microsoft.EntityFrameworkCore;
using ShopAI.Application.Common;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Enums;
using ShopAI.Domain.Exceptions;

namespace ShopAI.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IApplicationDbContext _context;

    public ProductService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProductDto>> GetProductsAsync(ProductQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var query = _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .AsQueryable();

        // Filters
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var searchLower = parameters.Search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchLower)
                                  || p.Sku.ToLower().Contains(searchLower)
                                  || p.ShortDescription.ToLower().Contains(searchLower));
        }

        if (parameters.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == parameters.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(parameters.CategorySlug))
        {
            query = query.Where(p => p.Category.Slug == parameters.CategorySlug.ToLower());
        }

        if (parameters.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price >= parameters.MinPrice.Value);
        }

        if (parameters.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= parameters.MaxPrice.Value);
        }

        if (parameters.MinRating.HasValue)
        {
            query = query.Where(p => p.AverageRating >= parameters.MinRating.Value);
        }

        if (parameters.InStockOnly == true)
        {
            query = query.Where(p => p.StockQuantity > 0);
        }

        if (parameters.FeaturedOnly == true)
        {
            query = query.Where(p => p.IsFeatured);
        }

        // Sorting
        query = parameters.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "rating" => query.OrderByDescending(p => p.AverageRating).ThenByDescending(p => p.ReviewCount),
            "name" => query.OrderBy(p => p.Name),
            _ => query.OrderByDescending(p => p.CreatedAt) // Default: newest
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var pageIndex = Math.Max(1, parameters.PageIndex);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);

        var items = await query
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto(
                p.Id,
                p.CategoryId,
                p.Category.Name,
                p.Name,
                p.Slug,
                p.Sku,
                p.ShortDescription,
                p.Price,
                p.OriginalPrice,
                p.StockQuantity,
                p.IsActive,
                p.IsFeatured,
                p.AverageRating,
                p.ReviewCount,
                p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                p.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductDto>(items, totalCount, pageIndex, pageSize);
    }

    public async Task<ProductDetailDto> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var p = await _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (p == null)
        {
            throw new NotFoundException(nameof(Product), id);
        }

        return MapToDetailDto(p);
    }

    public async Task<ProductDetailDto> GetProductBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var cleanSlug = slug.Trim().ToLowerInvariant();
        var p = await _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Slug == cleanSlug, cancellationToken);

        if (p == null)
        {
            throw new NotFoundException(nameof(Product), slug);
        }

        return MapToDetailDto(p);
    }

    public async Task<List<ProductDto>> GetFeaturedProductsAsync(int count = 8, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderByDescending(p => p.AverageRating)
            .ThenByDescending(p => p.CreatedAt)
            .Take(count)
            .Select(p => new ProductDto(
                p.Id,
                p.CategoryId,
                p.Category.Name,
                p.Name,
                p.Slug,
                p.Sku,
                p.ShortDescription,
                p.Price,
                p.OriginalPrice,
                p.StockQuantity,
                p.IsActive,
                p.IsFeatured,
                p.AverageRating,
                p.ReviewCount,
                p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                p.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ProductDto>> GetRelatedProductsAsync(Guid productId, int count = 4, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
        if (product == null) return new List<ProductDto>();

        return await _context.Products
            .AsNoTracking()
            .Where(p => p.Id != productId && p.CategoryId == product.CategoryId && p.IsActive)
            .OrderByDescending(p => p.AverageRating)
            .Take(count)
            .Select(p => new ProductDto(
                p.Id,
                p.CategoryId,
                p.Category.Name,
                p.Name,
                p.Slug,
                p.Sku,
                p.ShortDescription,
                p.Price,
                p.OriginalPrice,
                p.StockQuantity,
                p.IsActive,
                p.IsFeatured,
                p.AverageRating,
                p.ReviewCount,
                p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                p.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto, CancellationToken cancellationToken = default)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            throw new NotFoundException(nameof(Category), dto.CategoryId);
        }

        var skuExists = await _context.Products.AnyAsync(p => p.Sku.ToLower() == dto.Sku.Trim().ToLower(), cancellationToken);
        if (skuExists)
        {
            throw new DomainException($"A product with SKU '{dto.Sku}' already exists.");
        }

        var slug = GenerateSlug(dto.Name);
        var slugExists = await _context.Products.AnyAsync(p => p.Slug == slug, cancellationToken);
        if (slugExists)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";
        }

        var product = new Product
        {
            CategoryId = dto.CategoryId,
            Name = dto.Name.Trim(),
            Slug = slug,
            Sku = dto.Sku.Trim().ToUpperInvariant(),
            ShortDescription = dto.ShortDescription.Trim(),
            Description = dto.Description.Trim(),
            Price = dto.Price,
            OriginalPrice = dto.OriginalPrice,
            StockQuantity = dto.StockQuantity,
            IsFeatured = dto.IsFeatured,
            IsActive = true
        };

        if (dto.ImageUrls != null && dto.ImageUrls.Any())
        {
            int order = 0;
            foreach (var url in dto.ImageUrls)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = url,
                    IsPrimary = order == 0,
                    DisplayOrder = order++
                });
            }
        }

        // Record Initial Stock Transaction
        if (dto.StockQuantity > 0)
        {
            product.InventoryTransactions.Add(new InventoryTransaction
            {
                Type = InventoryTransactionType.InitialStock,
                QuantityChange = dto.StockQuantity,
                QuantityAfter = dto.StockQuantity,
                Reason = "Initial stock entry on product creation"
            });
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetProductByIdAsync(product.Id, cancellationToken);
    }

    public async Task<ProductDetailDto> UpdateProductAsync(Guid id, UpdateProductDto dto, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw new NotFoundException(nameof(Product), id);
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            throw new NotFoundException(nameof(Category), dto.CategoryId);
        }

        var skuExists = await _context.Products
            .AnyAsync(p => p.Id != id && p.Sku.ToLower() == dto.Sku.Trim().ToLower(), cancellationToken);
        if (skuExists)
        {
            throw new DomainException($"A product with SKU '{dto.Sku}' already exists.");
        }

        // Check if stock quantity changed
        if (product.StockQuantity != dto.StockQuantity)
        {
            var diff = dto.StockQuantity - product.StockQuantity;
            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                ProductId = product.Id,
                Type = diff > 0 ? InventoryTransactionType.PurchaseRestock : InventoryTransactionType.ManualAdjustment,
                QuantityChange = diff,
                QuantityAfter = dto.StockQuantity,
                Reason = "Manual stock update by Admin"
            });
            product.StockQuantity = dto.StockQuantity;
        }

        product.CategoryId = dto.CategoryId;
        product.Name = dto.Name.Trim();
        product.Sku = dto.Sku.Trim().ToUpperInvariant();
        product.ShortDescription = dto.ShortDescription.Trim();
        product.Description = dto.Description.Trim();
        product.Price = dto.Price;
        product.OriginalPrice = dto.OriginalPrice;
        product.IsActive = dto.IsActive;
        product.IsFeatured = dto.IsFeatured;
        product.UpdatedAt = DateTime.UtcNow;

        if (dto.ImageUrls != null)
        {
            _context.ProductImages.RemoveRange(product.Images);
            int order = 0;
            foreach (var url in dto.ImageUrls)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = url,
                    IsPrimary = order == 0,
                    DisplayOrder = order++
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return await GetProductByIdAsync(product.Id, cancellationToken);
    }

    public async Task DeleteProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .Include(p => p.OrderItems)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw new NotFoundException(nameof(Product), id);
        }

        // If product has order items, soft delete to preserve order history integrity!
        if (product.OrderItems.Any())
        {
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.Products.Remove(product);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static ProductDetailDto MapToDetailDto(Product p)
    {
        return new ProductDetailDto(
            p.Id,
            p.CategoryId,
            p.Category.Name,
            p.Name,
            p.Slug,
            p.Sku,
            p.ShortDescription,
            p.Description,
            p.Price,
            p.OriginalPrice,
            p.StockQuantity,
            p.IsActive,
            p.IsFeatured,
            p.AverageRating,
            p.ReviewCount,
            p.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto(
                i.Id,
                i.ImageUrl,
                i.AltText,
                i.IsPrimary,
                i.DisplayOrder
            )).ToList(),
            p.CreatedAt
        );
    }

    private static string GenerateSlug(string phrase)
    {
        string str = phrase.ToLowerInvariant();
        str = System.Text.RegularExpressions.Regex.Replace(str, @"[^a-z0-9\s-]", "");
        str = System.Text.RegularExpressions.Regex.Replace(str, @"\s+", " ").Trim();
        str = str.Substring(0, str.Length <= 80 ? str.Length : 80).Trim();
        str = System.Text.RegularExpressions.Regex.Replace(str, @"\s", "-");
        return str;
    }
}
