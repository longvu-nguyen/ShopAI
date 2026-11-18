using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using ShopAI.Domain.Exceptions;

namespace ShopAI.Api.Middleware;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;
        _logger.LogError(exception, "Unhandled exception occurred. TraceId: {TraceId}, Message: {Message}", traceId, exception.Message);

        var statusCode = exception switch
        {
            NotFoundException => HttpStatusCode.NotFound,
            InsufficientStockException => HttpStatusCode.BadRequest,
            DomainException => HttpStatusCode.BadRequest,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            FluentValidation.ValidationException => HttpStatusCode.BadRequest,
            _ => HttpStatusCode.InternalServerError
        };

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Instance = context.Request.Path,
            Detail = statusCode == HttpStatusCode.InternalServerError 
                ? "An unexpected internal server error occurred. Please contact system administrator." 
                : exception.Message,
            Title = exception switch
            {
                NotFoundException => "Resource Not Found",
                InsufficientStockException => "Insufficient Stock",
                DomainException => "Business Rule Violation",
                UnauthorizedAccessException => "Unauthorized",
                FluentValidation.ValidationException => "Validation Failed",
                _ => "Server Error"
            }
        };

        problemDetails.Extensions["traceId"] = traceId;

        if (exception is FluentValidation.ValidationException valEx)
        {
            problemDetails.Extensions["errors"] = valEx.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
