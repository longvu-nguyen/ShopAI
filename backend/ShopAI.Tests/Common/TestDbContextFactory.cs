using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using ShopAI.Infrastructure.Persistence;

namespace ShopAI.Tests.Common;

public static class TestDbContextFactory
{
    public static ShopAIDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ShopAIDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        var context = new ShopAIDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
