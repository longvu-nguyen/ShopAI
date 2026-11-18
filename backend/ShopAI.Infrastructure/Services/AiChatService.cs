using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Exceptions;

namespace ShopAI.Infrastructure.Services;

public class AiChatService : IAiChatService
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AiChatService(IApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<ChatResponseDto> SendMessageAsync(ChatRequestDto request, Guid? userId, CancellationToken cancellationToken = default)
    {
        var userText = request.Message.Trim();
        if (string.IsNullOrWhiteSpace(userText))
        {
            throw new DomainException("Message cannot be empty.");
        }

        // 1. Resolve or Create Chat Session
        ChatSession? session = null;
        if (!string.IsNullOrWhiteSpace(request.SessionToken))
        {
            session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.SessionToken == request.SessionToken, cancellationToken);
        }

        if (session == null)
        {
            session = new ChatSession
            {
                SessionToken = $"SES-{Guid.NewGuid():N}",
                UserId = userId,
                LastActiveAt = DateTime.UtcNow
            };
            _context.ChatSessions.Add(session);
        }
        else
        {
            if (userId.HasValue && session.UserId == null)
            {
                session.UserId = userId;
            }
            session.LastActiveAt = DateTime.UtcNow;
        }

        // Save User Message
        var userMsg = new ChatMessage
        {
            ChatSessionId = session.Id,
            Sender = "User",
            Message = userText
        };
        _context.ChatMessages.Add(userMsg);

        // 2. Process Assistant Response
        var (replyText, recommendations, orderSummary) = await GenerateReplyAsync(userText, userId, cancellationToken);

        string? metadataJson = null;
        if (recommendations != null && recommendations.Any())
        {
            metadataJson = JsonSerializer.Serialize(new { recommendations, orderSummary });
        }

        var assistantMsg = new ChatMessage
        {
            ChatSessionId = session.Id,
            Sender = "Assistant",
            Message = replyText,
            MetadataJson = metadataJson
        };
        _context.ChatMessages.Add(assistantMsg);

        await _context.SaveChangesAsync(cancellationToken);

        return new ChatResponseDto(
            session.SessionToken,
            replyText,
            recommendations,
            orderSummary,
            DateTime.UtcNow
        );
    }

    public async Task<ChatSessionDto> GetSessionHistoryAsync(string sessionToken, CancellationToken cancellationToken = default)
    {
        var session = await _context.ChatSessions
            .AsNoTracking()
            .Include(s => s.Messages.OrderBy(m => m.CreatedAt))
            .FirstOrDefaultAsync(s => s.SessionToken == sessionToken, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException(nameof(ChatSession), sessionToken);
        }

        var messages = session.Messages.Select(m => new ChatMessageDto(
            m.Id,
            m.Sender,
            m.Message,
            m.MetadataJson,
            m.CreatedAt
        )).ToList();

        return new ChatSessionDto(
            session.Id,
            session.SessionToken,
            session.CreatedAt,
            messages
        );
    }

    private async Task<(string Reply, List<ChatProductRecommendationDto>? Recommendations, string? OrderSummary)> GenerateReplyAsync(
        string message, Guid? userId, CancellationToken cancellationToken)
    {
        var text = message.ToLowerInvariant();

        // 1. ORDER TRACKING INTENT (e.g., "ORD-2026...", "đơn hàng", "tra cứu đơn", "where is my order", "order status")
        var orderMatch = Regex.Match(message, @"ORD-\d{8}-\d{5}", RegexOptions.IgnoreCase);
        if (orderMatch.Success)
        {
            var orderNum = orderMatch.Value.ToUpperInvariant();
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNum, cancellationToken);

            if (order != null)
            {
                var summary = $"Order #{order.OrderNumber}: Status is {order.Status}. Total: ${order.TotalAmount:N2}. ({order.Items.Count} items). Payment: {order.Payment?.Status}.";
                var reply = $"Here is the status for your order **{order.OrderNumber}**:\n\n" +
                            $"- **Status**: `{order.Status}`\n" +
                            $"- **Recipient**: {order.RecipientName}\n" +
                            $"- **Total Amount**: ${order.TotalAmount:N2}\n" +
                            $"- **Payment**: {order.Payment?.Method} ({order.Payment?.Status})\n" +
                            $"- **Estimated Delivery**: 2-4 business days\n\n" +
                            (string.IsNullOrEmpty(order.TrackingNumber) ? "" : $"- **Tracking Code**: `{order.TrackingNumber}`\n\n") +
                            "Let me know if you need to update any delivery details!";

                return (reply, null, summary);
            }
            else
            {
                return ($"I couldn't find any order matching code **{orderNum}**. Please check the code or contact support directly.", null, null);
            }
        }

        if (text.Contains("đơn hàng") || text.Contains("order") || text.Contains("tra cứu"))
        {
            if (userId.HasValue)
            {
                var latestOrder = await _context.Orders
                    .Where(o => o.UserId == userId.Value)
                    .OrderByDescending(o => o.CreatedAt)
                    .FirstOrDefaultAsync(cancellationToken);

                if (latestOrder != null)
                {
                    var reply = $"Your most recent order is **{latestOrder.OrderNumber}** with status `{latestOrder.Status}`, placed on {latestOrder.CreatedAt:yyyy-MM-dd}. Total: ${latestOrder.TotalAmount:N2}.\n\n" +
                                "To look up a different order, please provide the order code starting with `ORD-` (e.g. `ORD-20261119-12345`).";
                    return (reply, null, $"Recent order: {latestOrder.OrderNumber} ({latestOrder.Status})");
                }
            }

            return ("To track your order, please enter your order number (e.g., `ORD-20261119-12345`) or sign in to your ShopAI account to view your purchase history.", null, null);
        }

        // 2. FAQ INTENTS
        if (text.Contains("vận chuyển") || text.Contains("ship") || text.Contains("phí giao hàng") || text.Contains("delivery"))
        {
            return ("📦 **Shipping & Delivery Policy**:\n\n" +
                    "- **Standard Delivery**: 2–4 business days nationwide.\n" +
                    "- **Shipping Fee**: Flat $10.00 for orders under $100.\n" +
                    "- **Free Shipping**: Available automatically for all orders of **$100 or more**!\n" +
                    "- All orders come with end-to-end tracking.", null, null);
        }

        if (text.Contains("đổi trả") || text.Contains("hoàn tiền") || text.Contains("return") || text.Contains("refund") || text.Contains("bảo hành") || text.Contains("warranty"))
        {
            return ("🛡️ **Returns & Warranty Policy**:\n\n" +
                    "- **30-Day Hassle-Free Returns**: If you are not satisfied, return within 30 days for an exchange or full refund.\n" +
                    "- **12-Month Official Warranty**: Guaranteed on all electronic and audio devices.\n" +
                    "- Items must be returned in original packaging with accessories included.", null, null);
        }

        if (text.Contains("thanh toán") || text.Contains("payment") || text.Contains("momo") || text.Contains("vnpay") || text.Contains("credit card"))
        {
            return ("💳 **Accepted Payment Methods**:\n\n" +
                    "- **Credit/Debit Card**: Visa, MasterCard, JCB with instant 3D-Secure verification.\n" +
                    "- **E-Wallets**: MoMo and VNPay QR code payment.\n" +
                    "- **Cash on Delivery (COD)**: Pay securely upon package arrival.", null, null);
        }

        // 3. PRODUCT RECOMMENDATION INTENT
        // Query active products from DB to provide dynamic recommendations
        var productsQuery = _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Where(p => p.IsActive);

        // Keywords detection
        List<Product> matchedProducts;
        if (text.Contains("tai nghe") || text.Contains("headphone") || text.Contains("earbuds") || text.Contains("audio") || text.Contains("loa") || text.Contains("sound"))
        {
            matchedProducts = await productsQuery
                .Where(p => p.Category.Name.Contains("Audio") || p.Name.ToLower().Contains("headphone") || p.Name.ToLower().Contains("earbuds") || p.Name.ToLower().Contains("pro"))
                .OrderByDescending(p => p.AverageRating)
                .Take(3)
                .ToListAsync(cancellationToken);
        }
        else if (text.Contains("laptop") || text.Contains("máy tính") || text.Contains("computer") || text.Contains("macbook"))
        {
            matchedProducts = await productsQuery
                .Where(p => p.Category.Name.Contains("Computing") || p.Name.ToLower().Contains("laptop") || p.Name.ToLower().Contains("macbook"))
                .OrderByDescending(p => p.AverageRating)
                .Take(3)
                .ToListAsync(cancellationToken);
        }
        else if (text.Contains("smart home") || text.Contains("nhà thông minh") || text.Contains("đồng hồ") || text.Contains("watch"))
        {
            matchedProducts = await productsQuery
                .Where(p => p.Category.Name.Contains("Smart") || p.Name.ToLower().Contains("watch") || p.Name.ToLower().Contains("hub"))
                .OrderByDescending(p => p.AverageRating)
                .Take(3)
                .ToListAsync(cancellationToken);
        }
        else if (text.Contains("gợi ý") || text.Contains("recommend") || text.Contains("tư vấn") || text.Contains("best") || text.Contains("hot") || text.Contains("bán chạy"))
        {
            matchedProducts = await productsQuery
                .Where(p => p.IsFeatured)
                .OrderByDescending(p => p.AverageRating)
                .Take(3)
                .ToListAsync(cancellationToken);
        }
        else
        {
            // Fallback general recommendations if query seems product related
            matchedProducts = await productsQuery
                .OrderByDescending(p => p.AverageRating)
                .Take(2)
                .ToListAsync(cancellationToken);
        }

        var recommendations = matchedProducts.Select(p => new ChatProductRecommendationDto(
            p.Id,
            p.Name,
            p.Slug,
            p.Price,
            p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
            p.ShortDescription,
            p.AverageRating
        )).ToList();

        var greeting = "Hello! I am **ShopAI Assistant**, your intelligent shopping companion.\n\n" +
                       "Based on your request, here are top recommended products handpicked for you. You can click on any product card below to view full specifications or add directly to your cart:";

        return (greeting, recommendations, null);
    }
}
