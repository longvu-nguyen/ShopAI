using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAI.Application.Common;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;

namespace ShopAI.Api.Controllers;

public class OrdersController : ApiControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IValidator<CreateOrderDto> _createOrderValidator;

    public OrdersController(
        IOrderService orderService,
        IValidator<CreateOrderDto> createOrderValidator)
    {
        _orderService = orderService;
        _createOrderValidator = createOrderValidator;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder([FromBody] CreateOrderDto dto, CancellationToken cancellationToken)
    {
        var validation = await _createOrderValidator.ValidateAsync(dto, cancellationToken);
        if (!validation.IsValid)
        {
            throw new ValidationException(validation.Errors);
        }

        var order = await _orderService.CreateOrderAsync(CurrentUserId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ApiResponse<OrderDto>.Ok(order, "Order placed successfully."));
    }

    [Authorize]
    [HttpGet("my-orders")]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderDto>>>> GetMyOrders(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _orderService.GetMyOrdersAsync(CurrentUserId, pageIndex, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<OrderDto>>.Ok(result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var order = await _orderService.GetOrderByIdAsync(CurrentUserId, id, cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(order));
    }

    [HttpGet("track/{orderNumber}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> TrackOrder(string orderNumber, CancellationToken cancellationToken)
    {
        var order = await _orderService.GetOrderByNumberAsync(orderNumber, null, cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(order));
    }

    [Authorize]
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CancelOrder(Guid id, [FromBody] string? reason, CancellationToken cancellationToken)
    {
        var order = await _orderService.CancelOrderAsync(CurrentUserId, id, reason, cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(order, "Order cancelled successfully."));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderDto>>>> GetAdminOrders(
        [FromQuery] OrderQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.GetAdminOrdersAsync(parameters, cancellationToken);
        return Ok(ApiResponse<PagedResult<OrderDto>>.Ok(result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusDto dto, CancellationToken cancellationToken)
    {
        var order = await _orderService.UpdateOrderStatusAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(order, "Order status updated successfully."));
    }
}
