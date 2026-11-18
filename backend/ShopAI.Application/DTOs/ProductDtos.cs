namespace ShopAI.Application.DTOs;

public record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    bool IsActive,
    int DisplayOrder,
    int ProductCount
);

public record CreateCategoryDto(
    string Name,
    string? Description,
    string? ImageUrl,
    int DisplayOrder
);

public record UpdateCategoryDto(
    string Name,
    string? Description,
    string? ImageUrl,
    bool IsActive,
    int DisplayOrder
);

public record ProductImageDto(
    Guid Id,
    string ImageUrl,
    string? AltText,
    bool IsPrimary,
    int DisplayOrder
);

public record ProductDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Slug,
    string Sku,
    string ShortDescription,
    decimal Price,
    decimal? OriginalPrice,
    int StockQuantity,
    bool IsActive,
    bool IsFeatured,
    double AverageRating,
    int ReviewCount,
    string? PrimaryImageUrl,
    DateTime CreatedAt
);

public record ProductDetailDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Slug,
    string Sku,
    string ShortDescription,
    string Description,
    decimal Price,
    decimal? OriginalPrice,
    int StockQuantity,
    bool IsActive,
    bool IsFeatured,
    double AverageRating,
    int ReviewCount,
    List<ProductImageDto> Images,
    DateTime CreatedAt
);

public class ProductQueryParameters
{
    public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategorySlug { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public double? MinRating { get; set; }
    public bool? InStockOnly { get; set; }
    public bool? FeaturedOnly { get; set; }
    public string? SortBy { get; set; } // "price_asc", "price_desc", "rating", "newest", "name"
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public record CreateProductDto(
    Guid CategoryId,
    string Name,
    string Sku,
    string ShortDescription,
    string Description,
    decimal Price,
    decimal? OriginalPrice,
    int StockQuantity,
    bool IsFeatured,
    List<string>? ImageUrls
);

public record UpdateProductDto(
    Guid CategoryId,
    string Name,
    string Sku,
    string ShortDescription,
    string Description,
    decimal Price,
    decimal? OriginalPrice,
    int StockQuantity,
    bool IsActive,
    bool IsFeatured,
    List<string>? ImageUrls
);
