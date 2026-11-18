using Microsoft.EntityFrameworkCore;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Exceptions;

namespace ShopAI.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly IApplicationDbContext _context;

    public CategoryService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Categories
            .AsNoTracking()
            .Include(c => c.Products);

        var list = await (includeInactive ? query : query.Where(c => c.IsActive))
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.ImageUrl,
                c.IsActive,
                c.DisplayOrder,
                c.Products.Count(p => p.IsActive)
            ))
            .ToListAsync(cancellationToken);

        return list;
    }

    public async Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var c = await _context.Categories
            .AsNoTracking()
            .Include(x => x.Products)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (c == null)
        {
            throw new NotFoundException(nameof(Category), id);
        }

        return new CategoryDto(
            c.Id,
            c.Name,
            c.Slug,
            c.Description,
            c.ImageUrl,
            c.IsActive,
            c.DisplayOrder,
            c.Products.Count(p => p.IsActive)
        );
    }

    public async Task<CategoryDto> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var cleanSlug = slug.Trim().ToLowerInvariant();
        var c = await _context.Categories
            .AsNoTracking()
            .Include(x => x.Products)
            .FirstOrDefaultAsync(x => x.Slug == cleanSlug, cancellationToken);

        if (c == null)
        {
            throw new NotFoundException(nameof(Category), slug);
        }

        return new CategoryDto(
            c.Id,
            c.Name,
            c.Slug,
            c.Description,
            c.ImageUrl,
            c.IsActive,
            c.DisplayOrder,
            c.Products.Count(p => p.IsActive)
        );
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default)
    {
        var slug = GenerateSlug(dto.Name);
        var slugExists = await _context.Categories.AnyAsync(c => c.Slug == slug, cancellationToken);
        if (slugExists)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";
        }

        var category = new Category
        {
            Name = dto.Name.Trim(),
            Slug = slug,
            Description = dto.Description?.Trim(),
            ImageUrl = dto.ImageUrl,
            DisplayOrder = dto.DisplayOrder,
            IsActive = true
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        return new CategoryDto(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            category.ImageUrl,
            category.IsActive,
            category.DisplayOrder,
            0
        );
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryDto dto, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (category == null)
        {
            throw new NotFoundException(nameof(Category), id);
        }

        category.Name = dto.Name.Trim();
        category.Description = dto.Description?.Trim();
        category.ImageUrl = dto.ImageUrl;
        category.IsActive = dto.IsActive;
        category.DisplayOrder = dto.DisplayOrder;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new CategoryDto(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            category.ImageUrl,
            category.IsActive,
            category.DisplayOrder,
            category.Products.Count(p => p.IsActive)
        );
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (category == null)
        {
            throw new NotFoundException(nameof(Category), id);
        }

        if (category.Products.Any())
        {
            throw new DomainException("Cannot delete category because it contains products. Move or delete products first.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static string GenerateSlug(string phrase)
    {
        string str = phrase.ToLowerInvariant();
        // invalid chars           
        str = System.Text.RegularExpressions.Regex.Replace(str, @"[^a-z0-9\s-]", "");
        // convert multiple spaces into one space   
        str = System.Text.RegularExpressions.Regex.Replace(str, @"\s+", " ").Trim();
        // cut and trim 
        str = str.Substring(0, str.Length <= 80 ? str.Length : 80).Trim();
        str = System.Text.RegularExpressions.Regex.Replace(str, @"\s", "-"); // hyphens   
        return str;
    }
}
