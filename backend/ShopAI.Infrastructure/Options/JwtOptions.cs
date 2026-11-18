namespace ShopAI.Infrastructure.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = "ShopAI_SuperSecret_Jwt_SigningKey_2026_MustBeLongEnough_32BytesOrMore!";
    public string Issuer { get; set; } = "ShopAI";
    public string Audience { get; set; } = "ShopAIClient";
    public int AccessTokenExpirationMinutes { get; set; } = 60;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}
