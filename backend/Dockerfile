# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["ShopAI.slnx", "./"]
COPY ["ShopAI.Domain/ShopAI.Domain.csproj", "ShopAI.Domain/"]
COPY ["ShopAI.Application/ShopAI.Application.csproj", "ShopAI.Application/"]
COPY ["ShopAI.Infrastructure/ShopAI.Infrastructure.csproj", "ShopAI.Infrastructure/"]
COPY ["ShopAI.Api/ShopAI.Api.csproj", "ShopAI.Api/"]
COPY ["ShopAI.Tests/ShopAI.Tests.csproj", "ShopAI.Tests/"]

# Restore packages
RUN dotnet restore "ShopAI.Api/ShopAI.Api.csproj"

# Copy full source and publish
COPY . .
WORKDIR "/src/ShopAI.Api"
RUN dotnet publish "ShopAI.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ShopAI.Api.dll"]
