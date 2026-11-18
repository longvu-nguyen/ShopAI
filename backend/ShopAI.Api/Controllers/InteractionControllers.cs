using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAI.Application.Common;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;

namespace ShopAI.Api.Controllers;

public class ReviewsController : ApiControllerBase
{
    private readonly IReviewService _reviewService;
    private readonly IValidator<CreateReviewDto> _createReviewValidator;

    public ReviewsController(
        IReviewService reviewService,
        IValidator<CreateReviewDto> createReviewValidator)
    {
        _reviewService = reviewService;
        _createReviewValidator = createReviewValidator;
    }

    [HttpGet("product/{productId:guid}")]
    public async Task<ActionResult<ApiResponse<List<ReviewDto>>>> GetProductReviews(Guid productId, CancellationToken cancellationToken)
    {
        var reviews = await _reviewService.GetProductReviewsAsync(productId, cancellationToken);
        return Ok(ApiResponse<List<ReviewDto>>.Ok(reviews));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> AddReview([FromBody] CreateReviewDto dto, CancellationToken cancellationToken)
    {
        var validation = await _createReviewValidator.ValidateAsync(dto, cancellationToken);
        if (!validation.IsValid)
        {
            throw new ValidationException(validation.Errors);
        }

        var review = await _reviewService.AddReviewAsync(CurrentUserId, dto, cancellationToken);
        return Ok(ApiResponse<ReviewDto>.Ok(review, "Review submitted successfully."));
    }
}

[Authorize]
public class WishlistController : ApiControllerBase
{
    private readonly IWishlistService _wishlistService;

    public WishlistController(IWishlistService wishlistService)
    {
        _wishlistService = wishlistService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<WishlistDto>>>> GetWishlist(CancellationToken cancellationToken)
    {
        var list = await _wishlistService.GetUserWishlistAsync(CurrentUserId, cancellationToken);
        return Ok(ApiResponse<List<WishlistDto>>.Ok(list));
    }

    [HttpPost("toggle/{productId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleWishlist(Guid productId, CancellationToken cancellationToken)
    {
        var isInWishlist = await _wishlistService.ToggleWishlistAsync(CurrentUserId, productId, cancellationToken);
        var msg = isInWishlist ? "Added to wishlist." : "Removed from wishlist.";
        return Ok(ApiResponse<bool>.Ok(isInWishlist, msg));
    }

    [HttpGet("check/{productId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckWishlist(Guid productId, CancellationToken cancellationToken)
    {
        var exists = await _wishlistService.IsInWishlistAsync(CurrentUserId, productId, cancellationToken);
        return Ok(ApiResponse<bool>.Ok(exists));
    }
}
