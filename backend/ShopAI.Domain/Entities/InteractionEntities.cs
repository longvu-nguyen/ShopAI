using ShopAI.Domain.Common;

namespace ShopAI.Domain.Entities;

public class Review : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public int Rating { get; set; } // 1 to 5
    public string Comment { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = true;
    public bool IsVerifiedPurchase { get; set; } = false;
}

public class Wishlist : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
}

public class ChatSession : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string SessionToken { get; set; } = string.Empty;
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

public class ChatMessage : BaseEntity
{
    public Guid ChatSessionId { get; set; }
    public ChatSession ChatSession { get; set; } = null!;

    public string Sender { get; set; } = "User"; // "User" or "Assistant"
    public string Message { get; set; } = string.Empty;
    public string? MetadataJson { get; set; } // For recommended products, order lookups, etc.
}
