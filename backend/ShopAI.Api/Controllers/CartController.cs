using Microsoft.AspNetCore.Mvc;
using ShopAI.Application.Common;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;

namespace ShopAI.Api.Controllers;

public class CartController : ApiControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<CartDto>>> GetCart([FromHeader(Name = "X-Guest-Session-Id")] string? guestSessionId, CancellationToken cancellationToken)
    {
        var userId = IsUserAuthenticated ? CurrentUserId : (Guid?)null;
        var cart = await _cartService.GetCartAsync(userId, guestSessionId, cancellationToken);
        return Ok(ApiResponse<CartDto>.Ok(cart));
    }

    [HttpPost("items")]
    public async Task<ActionResult<ApiResponse<CartDto>>> AddItem(
        [FromBody] AddToCartDto dto,
        [FromHeader(Name = "X-Guest-Session-Id")] string? guestSessionId,
        CancellationToken cancellationToken)
    {
        var userId = IsUserAuthenticated ? CurrentUserId : (Guid?)null;
        var cart = await _cartService.AddItemAsync(userId, guestSessionId, dto, cancellationToken);
        return Ok(ApiResponse<CartDto>.Ok(cart, "Item added to cart."));
    }

    [HttpPut("items")]
    public async Task<ActionResult<ApiResponse<CartDto>>> UpdateItem(
        [FromBody] UpdateCartItemDto dto,
        [FromHeader(Name = "X-Guest-Session-Id")] string? guestSessionId,
        CancellationToken cancellationToken)
    {
        var userId = IsUserAuthenticated ? CurrentUserId : (Guid?)null;
        var cart = await _cartService.UpdateItemAsync(userId, guestSessionId, dto, cancellationToken);
        return Ok(ApiResponse<CartDto>.Ok(cart, "Cart updated."));
    }

    [HttpDelete("items/{cartItemId:guid}")]
    public async Task<ActionResult<ApiResponse<CartDto>>> RemoveItem(
        Guid cartItemId,
        [FromHeader(Name = "X-Guest-Session-Id")] string? guestSessionId,
        CancellationToken cancellationToken)
    {
        var userId = IsUserAuthenticated ? CurrentUserId : (Guid?)null;
        var cart = await _cartService.RemoveItemAsync(userId, guestSessionId, cartItemId, cancellationToken);
        return Ok(ApiResponse<CartDto>.Ok(cart, "Item removed from cart."));
    }

    [HttpDelete("clear")]
    public async Task<ActionResult<ApiResponse<string>>> ClearCart(
        [FromHeader(Name = "X-Guest-Session-Id")] string? guestSessionId,
        CancellationToken cancellationToken)
    {
        var userId = IsUserAuthenticated ? CurrentUserId : (Guid?)null;
        await _cartService.ClearCartAsync(userId, guestSessionId, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Cart cleared."));
    }

    [HttpPost("merge")]
    public async Task<ActionResult<ApiResponse<string>>> MergeCart(
        [FromBody] string guestSessionId,
        CancellationToken cancellationToken)
    {
        if (IsUserAuthenticated)
        {
            await _cartService.MergeCartAsync(CurrentUserId, guestSessionId, cancellationToken);
        }
        return Ok(ApiResponse<string>.Ok("Cart merged successfully."));
    }
}
