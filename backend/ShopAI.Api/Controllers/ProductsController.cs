using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAI.Application.Common;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;

namespace ShopAI.Api.Controllers;

public class ProductsController : ApiControllerBase
{
    private readonly IProductService _productService;
    private readonly IFileStorageService _fileStorage;
    private readonly IValidator<CreateProductDto> _createValidator;

    public ProductsController(
        IProductService productService,
        IFileStorageService fileStorage,
        IValidator<CreateProductDto> createValidator)
    {
        _productService = productService;
        _fileStorage = fileStorage;
        _createValidator = createValidator;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductDto>>>> GetProducts([FromQuery] ProductQueryParameters parameters, CancellationToken cancellationToken)
    {
        var result = await _productService.GetProductsAsync(parameters, cancellationToken);
        return Ok(ApiResponse<PagedResult<ProductDto>>.Ok(result));
    }

    [HttpGet("featured")]
    public async Task<ActionResult<ApiResponse<List<ProductDto>>>> GetFeatured([FromQuery] int count = 8, CancellationToken cancellationToken = default)
    {
        var list = await _productService.GetFeaturedProductsAsync(count, cancellationToken);
        return Ok(ApiResponse<List<ProductDto>>.Ok(list));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var product = await _productService.GetProductByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<ProductDetailDto>.Ok(product));
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var product = await _productService.GetProductBySlugAsync(slug, cancellationToken);
        return Ok(ApiResponse<ProductDetailDto>.Ok(product));
    }

    [HttpGet("{id:guid}/related")]
    public async Task<ActionResult<ApiResponse<List<ProductDto>>>> GetRelated(Guid id, [FromQuery] int count = 4, CancellationToken cancellationToken = default)
    {
        var related = await _productService.GetRelatedProductsAsync(id, count, cancellationToken);
        return Ok(ApiResponse<List<ProductDto>>.Ok(related));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> Create([FromBody] CreateProductDto dto, CancellationToken cancellationToken)
    {
        var validation = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validation.IsValid)
        {
            throw new ValidationException(validation.Errors);
        }

        var created = await _productService.CreateProductAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<ProductDetailDto>.Ok(created, "Product created successfully."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> Update(Guid id, [FromBody] UpdateProductDto dto, CancellationToken cancellationToken)
    {
        var updated = await _productService.UpdateProductAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<ProductDetailDto>.Ok(updated, "Product updated successfully."));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _productService.DeleteProductAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Product deleted or deactivated successfully."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<string>>> UploadImage([FromForm] ImageUploadRequest request, CancellationToken cancellationToken)
    {
        var file = request?.File;
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<string>.Fail("No file provided."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
        {
            return BadRequest(ApiResponse<string>.Fail("Only JPG, PNG, and WebP images are allowed."));
        }

        using var stream = file.OpenReadStream();
        var relativeUrl = await _fileStorage.SaveFileAsync(stream, file.FileName, "products", cancellationToken);
        return Ok(ApiResponse<string>.Ok(relativeUrl, "Image uploaded successfully."));
    }
}

public class ImageUploadRequest
{
    public IFormFile File { get; set; } = null!;
}
