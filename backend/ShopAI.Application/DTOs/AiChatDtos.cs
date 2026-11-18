namespace ShopAI.Application.DTOs;

public record ChatRequestDto(
    string Message,
    string? SessionToken
);

public record ChatProductRecommendationDto(
    Guid Id,
    string Name,
    string Slug,
    decimal Price,
    string? ImageUrl,
    string ShortDescription,
    double Rating
);

public record ChatResponseDto(
    string SessionToken,
    string Reply,
    List<ChatProductRecommendationDto>? RecommendedProducts,
    string? OrderLookupSummary,
    DateTime Timestamp
);

public record ChatMessageDto(
    Guid Id,
    string Sender,
    string Message,
    string? MetadataJson,
    DateTime CreatedAt
);

public record ChatSessionDto(
    Guid Id,
    string SessionToken,
    DateTime CreatedAt,
    List<ChatMessageDto> Messages
);
