namespace ShopAI.Application.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? PhoneNumber
);

public record LoginRequest(
    string Email,
    string Password
);

public record RefreshTokenRequest(
    string AccessToken,
    string RefreshToken
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);

public record AuthResponse(
    Guid UserId,
    string Email,
    string FullName,
    List<string> Roles,
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt
);

public record UserProfileDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string? AvatarUrl,
    List<string> Roles,
    DateTime CreatedAt
);

public record UpdateProfileDto(
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string? AvatarUrl
);
