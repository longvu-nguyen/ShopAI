using System.Text;
using Microsoft.EntityFrameworkCore;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Enums;

namespace ShopAI.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly IApplicationDbContext _context;

    public AdminService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminDashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
    {
        var totalOrders = await _context.Orders.CountAsync(cancellationToken);
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending, cancellationToken);
        var completedOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Delivered, cancellationToken);

        var totalRevenue = await _context.Orders
            .Where(o => o.Status != OrderStatus.Cancelled)
            .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0m;

        var todayUtc = DateTime.UtcNow.Date;
        var todayRevenue = await _context.Orders
            .Where(o => o.Status != OrderStatus.Cancelled && o.CreatedAt >= todayUtc)
            .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0m;

        var customerRoleName = UserRoleType.Customer.ToString();
        var totalCustomers = await _context.UserRoles
            .CountAsync(ur => ur.Role.Name == customerRoleName, cancellationToken);

        var totalProducts = await _context.Products.CountAsync(p => p.IsActive, cancellationToken);
        var lowStockProductCount = await _context.Products.CountAsync(p => p.IsActive && p.StockQuantity <= 5, cancellationToken);

        var recentOrders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new RecentOrderDto(
                o.Id,
                o.OrderNumber,
                o.RecipientName,
                o.TotalAmount,
                o.Status.ToString(),
                o.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        // Revenue past 7 days
        var sevenDaysAgo = DateTime.UtcNow.Date.AddDays(-6);
        var ordersPastWeek = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Status != OrderStatus.Cancelled && o.CreatedAt >= sevenDaysAgo)
            .Select(o => new { o.CreatedAt, o.TotalAmount })
            .ToListAsync(cancellationToken);

        var revenueOverTime = new List<RevenueDataPointDto>();
        for (int i = 0; i < 7; i++)
        {
            var day = sevenDaysAgo.AddDays(i);
            var nextDay = day.AddDays(1);
            var dayOrders = ordersPastWeek.Where(o => o.CreatedAt >= day && o.CreatedAt < nextDay).ToList();

            revenueOverTime.Add(new RevenueDataPointDto(
                day.ToString("MM/dd"),
                dayOrders.Sum(o => o.TotalAmount),
                dayOrders.Count
            ));
        }

        return new AdminDashboardMetricsDto(
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue,
            todayRevenue,
            totalCustomers,
            totalProducts,
            lowStockProductCount,
            recentOrders,
            revenueOverTime
        );
    }

    public async Task<List<InventoryAlertDto>> GetLowStockAlertsAsync(int threshold = 5, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.StockQuantity <= threshold)
            .OrderBy(p => p.StockQuantity)
            .Select(p => new InventoryAlertDto(
                p.Id,
                p.Name,
                p.Sku,
                p.StockQuantity,
                threshold
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<byte[]> ExportOrdersCsvAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .AsQueryable();

        if (fromDate.HasValue) query = query.Where(o => o.CreatedAt >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(o => o.CreatedAt <= toDate.Value);

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("OrderNumber,CustomerEmail,RecipientName,Phone,Status,Subtotal,ShippingFee,TotalAmount,PaymentMethod,PaymentStatus,CreatedAt");

        foreach (var o in orders)
        {
            sb.AppendLine($"\"{o.OrderNumber}\",\"{o.User?.Email}\",\"{o.RecipientName}\",\"{o.PhoneNumber}\",\"{o.Status}\",{o.Subtotal},{o.ShippingFee},{o.TotalAmount},\"{o.Payment?.Method}\",\"{o.Payment?.Status}\",\"{o.CreatedAt:yyyy-MM-dd HH:mm:ss}\"");
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }
}
