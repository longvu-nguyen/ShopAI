using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAI.Application.Common;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;

namespace ShopAI.Api.Controllers;

[Authorize(Roles = "Admin")]
public class AdminController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("metrics")]
    public async Task<ActionResult<ApiResponse<AdminDashboardMetricsDto>>> GetDashboardMetrics(CancellationToken cancellationToken)
    {
        var metrics = await _adminService.GetDashboardMetricsAsync(cancellationToken);
        return Ok(ApiResponse<AdminDashboardMetricsDto>.Ok(metrics));
    }

    [HttpGet("inventory/alerts")]
    public async Task<ActionResult<ApiResponse<List<InventoryAlertDto>>>> GetLowStockAlerts(
        [FromQuery] int threshold = 5,
        CancellationToken cancellationToken = default)
    {
        var alerts = await _adminService.GetLowStockAlertsAsync(threshold, cancellationToken);
        return Ok(ApiResponse<List<InventoryAlertDto>>.Ok(alerts));
    }

    [HttpGet("orders/export-csv")]
    public async Task<IActionResult> ExportOrdersCsv(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var csvBytes = await _adminService.ExportOrdersCsvAsync(fromDate, toDate, cancellationToken);
        var fileName = $"ShopAI_Orders_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return File(csvBytes, "text/csv; charset=utf-8", fileName);
    }
}
