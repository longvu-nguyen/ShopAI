using FluentAssertions;
using ShopAI.Application.DTOs;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Enums;
using ShopAI.Domain.Exceptions;
using ShopAI.Infrastructure.Services;
using ShopAI.Tests.Common;
using Xunit;

namespace ShopAI.Tests.Services;

public class OrderServiceTests
{
    [Fact]
    public async Task CreateOrder_WithSufficientStock_DeductsInventory_AndCreatesOrder()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var orderService = new OrderService(context);

        var user = new User { Email = "user@test.com", FirstName = "Test", LastName = "User" };
        var category = new Category { Name = "Audio", Slug = "audio" };
        var product = new Product
        {
            Category = category,
            Name = "Test Headphone",
            Slug = "test-headphone",
            Sku = "TEST-HEADPHONE",
            Price = 100m,
            StockQuantity = 10,
            IsActive = true
        };

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var orderDto = new CreateOrderDto(
            RecipientName: "Test User",
            PhoneNumber: "0123456789",
            ShippingAddress: "123 Street",
            PaymentMethod: PaymentMethod.CreditCard,
            Notes: null,
            DirectItems: new List<CreateOrderItemDto>
            {
                new(product.Id, 3)
            }
        );

        // Act
        var result = await orderService.CreateOrderAsync(user.Id, orderDto);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(OrderStatus.Pending);
        result.TotalAmount.Should().Be(300m); // $300 (over $100 -> free shipping)

        // Verify stock deducted
        var updatedProduct = await context.Products.FindAsync(product.Id);
        updatedProduct!.StockQuantity.Should().Be(7); // 10 - 3 = 7

        // Verify inventory transaction created
        context.InventoryTransactions.Should().ContainSingle(t =>
            t.ProductId == product.Id &&
            t.Type == InventoryTransactionType.OrderPlaced &&
            t.QuantityChange == -3);
    }

    [Fact]
    public async Task CreateOrder_WithInsufficientStock_ThrowsInsufficientStockException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var orderService = new OrderService(context);

        var user = new User { Email = "user2@test.com", FirstName = "Test", LastName = "User" };
        var category = new Category { Name = "Audio", Slug = "audio2" };
        var product = new Product
        {
            Category = category,
            Name = "Limited Headphone",
            Slug = "limited-headphone",
            Sku = "LIMITED-SKU",
            Price = 100m,
            StockQuantity = 2,
            IsActive = true
        };

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var orderDto = new CreateOrderDto(
            RecipientName: "Test User",
            PhoneNumber: "0123456789",
            ShippingAddress: "123 Street",
            PaymentMethod: PaymentMethod.CreditCard,
            Notes: null,
            DirectItems: new List<CreateOrderItemDto>
            {
                new(product.Id, 5) // Requesting 5 when only 2 available
            }
        );

        // Act & Assert
        var act = async () => await orderService.CreateOrderAsync(user.Id, orderDto);
        await act.Should().ThrowAsync<InsufficientStockException>();

        // Verify stock unchanged
        var currentProduct = await context.Products.FindAsync(product.Id);
        currentProduct!.StockQuantity.Should().Be(2);
    }

    [Fact]
    public async Task CancelOrder_WhenPending_RestoresStock_AndChangesStatusToCancelled()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var orderService = new OrderService(context);

        var user = new User { Email = "cancel@test.com", FirstName = "Cancel", LastName = "User" };
        var category = new Category { Name = "Category", Slug = "category" };
        var product = new Product
        {
            Category = category,
            Name = "Product",
            Slug = "prod",
            Sku = "PROD-SKU",
            Price = 50m,
            StockQuantity = 5,
            IsActive = true
        };

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var created = await orderService.CreateOrderAsync(user.Id, new CreateOrderDto(
            RecipientName: "Cancel User",
            PhoneNumber: "0123456789",
            ShippingAddress: "123 Street",
            PaymentMethod: PaymentMethod.CashOnDelivery,
            Notes: null,
            DirectItems: new List<CreateOrderItemDto> { new(product.Id, 2) }
        ));

        (await context.Products.FindAsync(product.Id))!.StockQuantity.Should().Be(3);

        // Act: Cancel order
        var cancelled = await orderService.CancelOrderAsync(user.Id, created.Id, "Changed mind");

        // Assert
        cancelled.Status.Should().Be(OrderStatus.Cancelled);

        // Verify stock restored
        var restoredProduct = await context.Products.FindAsync(product.Id);
        restoredProduct!.StockQuantity.Should().Be(5);

        // Verify restoration transaction logged
        context.InventoryTransactions.Should().Contain(t =>
            t.ProductId == product.Id &&
            t.Type == InventoryTransactionType.OrderCancelled &&
            t.QuantityChange == 2);
    }
}
