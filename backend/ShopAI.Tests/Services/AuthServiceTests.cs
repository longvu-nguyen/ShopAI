using FluentAssertions;
using Moq;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Exceptions;
using ShopAI.Infrastructure.Services;
using ShopAI.Tests.Common;
using Xunit;

namespace ShopAI.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IPasswordHasher> _mockHasher;
    private readonly Mock<IJwtService> _mockJwtService;

    public AuthServiceTests()
    {
        _mockHasher = new Mock<IPasswordHasher>();
        _mockJwtService = new Mock<IJwtService>();

        _mockHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed_secret");
        _mockHasher.Setup(h => h.Verify("CorrectPassword", "hashed_secret")).Returns(true);
        _mockHasher.Setup(h => h.Verify("WrongPassword", "hashed_secret")).Returns(false);

        _mockJwtService.Setup(j => j.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<string>>()))
            .Returns(("mock_jwt_token", "mock_jti", DateTime.UtcNow.AddHours(1)));

        _mockJwtService.Setup(j => j.GenerateRefreshToken(It.IsAny<Guid>(), It.IsAny<string>()))
            .Returns(new RefreshToken { Token = "mock_refresh_token", ExpiryDate = DateTime.UtcNow.AddDays(7) });
    }

    [Fact]
    public async Task RegisterAsync_WithNewEmail_CreatesUserAndReturnsTokens()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var authService = new AuthService(context, _mockHasher.Object, _mockJwtService.Object);

        var request = new RegisterRequest(
            Email: "newuser@shopai.com",
            Password: "Password123!",
            FirstName: "New",
            LastName: "User",
            PhoneNumber: "0901234567"
        );

        // Act
        var response = await authService.RegisterAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Email.Should().Be("newuser@shopai.com");
        response.AccessToken.Should().Be("mock_jwt_token");
        response.RefreshToken.Should().Be("mock_refresh_token");

        var userInDb = context.Users.FirstOrDefault(u => u.Email == "newuser@shopai.com");
        userInDb.Should().NotBeNull();
        userInDb!.PasswordHash.Should().Be("hashed_secret");
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ThrowsDomainException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var authService = new AuthService(context, _mockHasher.Object, _mockJwtService.Object);

        context.Users.Add(new User { Email = "existing@shopai.com", FirstName = "A", LastName = "B" });
        await context.SaveChangesAsync();

        var request = new RegisterRequest(
            Email: "existing@shopai.com",
            Password: "Password123!",
            FirstName: "Duplicate",
            LastName: "User",
            PhoneNumber: null
        );

        // Act & Assert
        var act = async () => await authService.RegisterAsync(request);
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokens()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var authService = new AuthService(context, _mockHasher.Object, _mockJwtService.Object);

        var user = new User
        {
            Email = "valid@shopai.com",
            PasswordHash = "hashed_secret",
            FirstName = "Valid",
            LastName = "User",
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act
        var response = await authService.LoginAsync(new LoginRequest("valid@shopai.com", "CorrectPassword"));

        // Assert
        response.Should().NotBeNull();
        response.Email.Should().Be("valid@shopai.com");
        response.AccessToken.Should().Be("mock_jwt_token");
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsDomainException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var authService = new AuthService(context, _mockHasher.Object, _mockJwtService.Object);

        var user = new User
        {
            Email = "valid@shopai.com",
            PasswordHash = "hashed_secret",
            FirstName = "Valid",
            LastName = "User",
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act & Assert
        var act = async () => await authService.LoginAsync(new LoginRequest("valid@shopai.com", "WrongPassword"));
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*Invalid email or password*");
    }
}
