using Microsoft.EntityFrameworkCore;
using ShopAI.Application.Interfaces;
using ShopAI.Domain.Entities;
using ShopAI.Domain.Enums;

namespace ShopAI.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ShopAIDbContext context, IPasswordHasher passwordHasher)
    {
        // Apply migrations if any pending
        await context.Database.MigrateAsync();

        // 1. Seed Roles
        if (!await context.Roles.AnyAsync())
        {
            var roles = new List<Role>
            {
                new() { Name = UserRoleType.Admin.ToString(), Description = "Administrator with full system privileges" },
                new() { Name = UserRoleType.Customer.ToString(), Description = "Standard customer account" }
            };
            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();
        }

        var adminRole = await context.Roles.FirstAsync(r => r.Name == UserRoleType.Admin.ToString());
        var customerRole = await context.Roles.FirstAsync(r => r.Name == UserRoleType.Customer.ToString());

        // 2. Seed Users
        User adminUser;
        User demoCustomer;

        if (!await context.Users.AnyAsync(u => u.Email == "admin@shopai.com"))
        {
            adminUser = new User
            {
                Email = "admin@shopai.com",
                PasswordHash = passwordHasher.Hash("Admin@123456"),
                FirstName = "ShopAI",
                LastName = "Administrator",
                PhoneNumber = "+84 901 234 567",
                AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
                IsActive = true
            };
            adminUser.UserRoles.Add(new UserRole { User = adminUser, Role = adminRole });
            adminUser.UserRoles.Add(new UserRole { User = adminUser, Role = customerRole });
            await context.Users.AddAsync(adminUser);
        }
        else
        {
            adminUser = await context.Users.FirstAsync(u => u.Email == "admin@shopai.com");
        }

        if (!await context.Users.AnyAsync(u => u.Email == "customer@shopai.com"))
        {
            demoCustomer = new User
            {
                Email = "customer@shopai.com",
                PasswordHash = passwordHasher.Hash("Customer@123456"),
                FirstName = "Alex",
                LastName = "Morgan",
                PhoneNumber = "+84 988 765 432",
                AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
                IsActive = true
            };
            demoCustomer.UserRoles.Add(new UserRole { User = demoCustomer, Role = customerRole });

            demoCustomer.Addresses.Add(new Address
            {
                RecipientName = "Alex Morgan",
                PhoneNumber = "+84 988 765 432",
                Street = "123 Nguyen Hue Boulevard",
                Ward = "Ben Nghe Ward",
                District = "District 1",
                City = "Ho Chi Minh City",
                IsDefault = true
            });

            await context.Users.AddAsync(demoCustomer);
        }
        else
        {
            demoCustomer = await context.Users.FirstAsync(u => u.Email == "customer@shopai.com");
        }

        await context.SaveChangesAsync();

        // 3. Seed Categories
        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<Category>
            {
                new()
                {
                    Name = "Laptops & Computers",
                    Slug = "laptops-computers",
                    Description = "High-performance laptops, workstations, and next-gen ultrabooks.",
                    ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
                    DisplayOrder = 1,
                    IsActive = true
                },
                new()
                {
                    Name = "Smartphones & Tablets",
                    Slug = "smartphones-tablets",
                    Description = "Flagship smartphones, pro tablets, and mobile photography gear.",
                    ImageUrl = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
                    DisplayOrder = 2,
                    IsActive = true
                },
                new()
                {
                    Name = "Audio & Wearables",
                    Slug = "audio-wearables",
                    Description = "Active noise cancelling headphones, wireless earbuds, and smartwatches.",
                    ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                    DisplayOrder = 3,
                    IsActive = true
                },
                new()
                {
                    Name = "Smart Home & IoT",
                    Slug = "smart-home-iot",
                    Description = "Intelligent home automation, connected speakers, and security hubs.",
                    ImageUrl = "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
                    DisplayOrder = 4,
                    IsActive = true
                },
                new()
                {
                    Name = "Accessories & Gaming",
                    Slug = "accessories-gaming",
                    Description = "Ergonomic keyboards, gaming mice, chargers, and studio desk docks.",
                    ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
                    DisplayOrder = 5,
                    IsActive = true
                }
            };
            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }

        // 4. Seed Products
        if (!await context.Products.AnyAsync())
        {
            var catLaptops = await context.Categories.FirstAsync(c => c.Slug == "laptops-computers");
            var catPhones = await context.Categories.FirstAsync(c => c.Slug == "smartphones-tablets");
            var catAudio = await context.Categories.FirstAsync(c => c.Slug == "audio-wearables");
            var catSmartHome = await context.Categories.FirstAsync(c => c.Slug == "smart-home-iot");
            var catAccessories = await context.Categories.FirstAsync(c => c.Slug == "accessories-gaming");

            var products = new List<Product>
            {
                // Audio
                new()
                {
                    CategoryId = catAudio.Id,
                    Name = "ShopAI Apex Pro Wireless ANC Headphones",
                    Slug = "shopai-apex-pro-wireless-anc-headphones",
                    Sku = "AUDIO-APEX-PRO",
                    ShortDescription = "Audiophile acoustic architecture with 42dB adaptive ANC and 40h battery.",
                    Description = "Engineered for immersive sound, Apex Pro features custom 40mm beryllium drivers, dual-core active noise cancellation, lossless Bluetooth 5.4 with LDAC support, and plush memory foam earcups for all-day comfort.",
                    Price = 249.99m,
                    OriginalPrice = 299.99m,
                    StockQuantity = 45,
                    IsActive = true,
                    IsFeatured = true,
                    AverageRating = 4.9,
                    ReviewCount = 28,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 },
                        new() { ImageUrl = "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80", IsPrimary = false, DisplayOrder = 1 }
                    }
                },
                new()
                {
                    CategoryId = catAudio.Id,
                    Name = "SonicFlow True Wireless Earbuds",
                    Slug = "sonicflow-true-wireless-earbuds",
                    Sku = "AUDIO-SONIC-FLOW",
                    ShortDescription = "Compact spatial audio earbuds with transparency mode and Qi wireless charging.",
                    Description = "Ultra-compact in-ear monitors equipped with spatial audio head tracking, IPX7 waterproof rating, crystal-clear 6-mic beamforming call clarity, and 32 hours total playtime with pocket charging case.",
                    Price = 119.00m,
                    OriginalPrice = 149.00m,
                    StockQuantity = 80,
                    IsActive = true,
                    IsFeatured = true,
                    AverageRating = 4.7,
                    ReviewCount = 19,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },
                new()
                {
                    CategoryId = catAudio.Id,
                    Name = "Pulse Horizon Smart Fitness Watch",
                    Slug = "pulse-horizon-smart-fitness-watch",
                    Sku = "WEAR-PULSE-HORIZON",
                    ShortDescription = "Titanium body smartwatch with sapphire glass, AMOLED display, and ECG heart monitor.",
                    Description = "Track over 120 sports modes with dual-frequency GPS, blood oxygen SpO2 monitoring, stress tracker, 14-day battery life, and seamless notifications integration with iOS and Android.",
                    Price = 189.50m,
                    OriginalPrice = 229.00m,
                    StockQuantity = 32,
                    IsActive = true,
                    IsFeatured = true,
                    AverageRating = 4.8,
                    ReviewCount = 14,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },

                // Laptops
                new()
                {
                    CategoryId = catLaptops.Id,
                    Name = "NovaBook Ultra 14 Studio Edition",
                    Slug = "novabook-ultra-14-studio-edition",
                    Sku = "LAP-NOVA-14",
                    ShortDescription = "14.5\" 3K 120Hz OLED, 16-Core Processor, 32GB LPDDR5X, 1TB NVMe PCIe 4.0 SSD.",
                    Description = "Crafted for creators and engineers, NovaBook Ultra 14 weighs only 1.28kg with CNC aerospace aluminum chassis. Features stunning color-accurate 100% DCI-P3 display, vapor chamber cooling, and 18-hour battery longevity.",
                    Price = 1399.00m,
                    OriginalPrice = 1599.00m,
                    StockQuantity = 15,
                    IsActive = true,
                    IsFeatured = true,
                    AverageRating = 5.0,
                    ReviewCount = 12,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },
                new()
                {
                    CategoryId = catLaptops.Id,
                    Name = "TitanBlade 16 Gaming Laptop",
                    Slug = "titanblade-16-gaming-laptop",
                    Sku = "LAP-TITAN-16",
                    ShortDescription = "QHD 240Hz Gaming powerhouse with RTX 4080 GPU and liquid metal cooling.",
                    Description = "Designed for competitive esports and AAA title fidelity. Features per-key RGB mechanical keyboard, Thunderbolt 4 connectivity, Wi-Fi 7, and 99.9Wh max legal air travel battery capacity.",
                    Price = 1999.00m,
                    OriginalPrice = 2299.00m,
                    StockQuantity = 8,
                    IsActive = true,
                    IsFeatured = true,
                    AverageRating = 4.8,
                    ReviewCount = 9,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },

                // Phones
                new()
                {
                    CategoryId = catPhones.Id,
                    Name = "Nexus One Pro 5G Flagship",
                    Slug = "nexus-one-pro-5g-flagship",
                    Sku = "PHONE-NEXUS-PRO",
                    ShortDescription = "Snapdragon 8 Gen 3, 200MP Quad-Camera array, 6.8\" LTPO AMOLED, 5400mAh.",
                    Description = "The pinnacle of smartphone innovation with cinematic 8K video, titanium rail construction, IP68 water resistance, ultrasonic in-display fingerprint reader, and 100W HyperCharge.",
                    Price = 949.00m,
                    OriginalPrice = 1099.00m,
                    StockQuantity = 25,
                    IsActive = true,
                    IsFeatured = true,
                    AverageRating = 4.9,
                    ReviewCount = 31,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },
                new()
                {
                    CategoryId = catPhones.Id,
                    Name = "AeroPad Pro 12.9 Tablet",
                    Slug = "aeropad-pro-12-9-tablet",
                    Sku = "TAB-AERO-129",
                    ShortDescription = "Mini-LED Liquid Retina XDR display with M-Series silicon and active magnetic stylus.",
                    Description = "Transform how you sketch, design, and multitask with 1600 nits peak brightness, quad stereo speakers, dual rear cameras with LiDAR scanner, and all-day battery efficiency.",
                    Price = 849.00m,
                    OriginalPrice = 999.00m,
                    StockQuantity = 18,
                    IsActive = true,
                    IsFeatured = false,
                    AverageRating = 4.7,
                    ReviewCount = 11,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },

                // Smart Home
                new()
                {
                    CategoryId = catSmartHome.Id,
                    Name = "AuraSphere Intelligent Smart Speaker & Hub",
                    Slug = "aurasphere-smart-speaker-hub",
                    Sku = "SMART-AURA-SPHERE",
                    ShortDescription = "360-degree spatial audio smart speaker with built-in Matter & Zigbee hub.",
                    Description = "Integrate your entire home with voice-driven smart scene automations, ambient light sensor, presence detection, and room-filling bass tuned by master acoustic engineers.",
                    Price = 79.99m,
                    OriginalPrice = 99.99m,
                    StockQuantity = 60,
                    IsActive = true,
                    IsFeatured = true,
                    AverageRating = 4.6,
                    ReviewCount = 16,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },
                new()
                {
                    CategoryId = catSmartHome.Id,
                    Name = "GuardianCam 4K HDR Security Camera",
                    Slug = "guardiancam-4k-hdr-security-camera",
                    Sku = "SMART-GUARD-CAM",
                    ShortDescription = "Weatherproof wireless security camera with color night vision and AI person detection.",
                    Description = "Solar-compatible wireless home guardian with 365-day battery on a single charge, local encrypted MicroSD/NAS storage, dual spotlights, and two-way real-time audio intercom.",
                    Price = 129.00m,
                    OriginalPrice = 159.00m,
                    StockQuantity = 40,
                    IsActive = true,
                    IsFeatured = false,
                    AverageRating = 4.8,
                    ReviewCount = 22,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },

                // Accessories
                new()
                {
                    CategoryId = catAccessories.Id,
                    Name = "KeyMatrix Custom Wireless Mechanical Keyboard",
                    Slug = "keymatrix-custom-wireless-mechanical-keyboard",
                    Sku = "ACC-KEY-MATRIX",
                    ShortDescription = "75% Hot-swappable gasket mount keyboard with custom pre-lubed tactile switches.",
                    Description = "Crafted for enthusiasts with CNC anodized aluminum top case, PBT dye-sub keycaps, sound dampening silicone layers, multi-device Bluetooth/2.4GHz/Type-C tri-mode connectivity.",
                    Price = 145.00m,
                    OriginalPrice = 175.00m,
                    StockQuantity = 35,
                    IsActive = true,
                    IsFeatured = true,
                    AverageRating = 4.9,
                    ReviewCount = 20,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },
                new()
                {
                    CategoryId = catAccessories.Id,
                    Name = "SwiftGrip Precision Wireless Gaming Mouse",
                    Slug = "swiftgrip-precision-wireless-gaming-mouse",
                    Sku = "ACC-SWIFT-GRIP",
                    ShortDescription = "Ultra-lightweight 54g ergonomic mouse with 32,000 DPI optical sensor and 4K polling.",
                    Description = "Pixel-perfect accuracy, optical microswitches rated for 90 million clicks, pure PTFE skates, and zero latency wireless dongle engineered for esports champions.",
                    Price = 79.00m,
                    OriginalPrice = 99.00m,
                    StockQuantity = 50,
                    IsActive = true,
                    IsFeatured = false,
                    AverageRating = 4.7,
                    ReviewCount = 15,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                },
                new()
                {
                    CategoryId = catAccessories.Id,
                    Name = "VoltForge 140W GaN Pro Desktop Fast Charger",
                    Slug = "voltforge-140w-gan-fast-charger",
                    Sku = "ACC-VOLT-140W",
                    ShortDescription = "3x USB-C + 1x USB-A PD 3.1 ultra-compact multi-device power station.",
                    Description = "Charges MacBook Pro 16\" to 50% in just 28 minutes. Intelligent dynamic power distribution, aerospace heat dissipation, and universal voltage compatibility for global travel.",
                    Price = 69.99m,
                    OriginalPrice = 89.99m,
                    StockQuantity = 75,
                    IsActive = true,
                    IsFeatured = false,
                    AverageRating = 4.9,
                    ReviewCount = 34,
                    Images = new List<ProductImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80", IsPrimary = true, DisplayOrder = 0 }
                    }
                }
            };

            foreach (var prod in products)
            {
                prod.InventoryTransactions.Add(new InventoryTransaction
                {
                    Type = InventoryTransactionType.InitialStock,
                    QuantityChange = prod.StockQuantity,
                    QuantityAfter = prod.StockQuantity,
                    Reason = "Initial Seed Catalog Entry"
                });
            }

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }

        // 5. Seed Sample Orders and Reviews for customer
        if (!await context.Orders.AnyAsync())
        {
            var headphone = await context.Products.FirstAsync(p => p.Sku == "AUDIO-APEX-PRO");
            var charger = await context.Products.FirstAsync(p => p.Sku == "ACC-VOLT-140W");
            var keyboard = await context.Products.FirstAsync(p => p.Sku == "ACC-KEY-MATRIX");

            // Order 1: Delivered past order
            var pastDate = DateTime.UtcNow.AddDays(-12);
            var order1 = new Order
            {
                OrderNumber = "ORD-20261107-10492",
                UserId = demoCustomer.Id,
                RecipientName = demoCustomer.FullName,
                PhoneNumber = demoCustomer.PhoneNumber ?? "+84 988 765 432",
                ShippingAddress = "123 Nguyen Hue Boulevard, Ben Nghe Ward, District 1, Ho Chi Minh City",
                Status = OrderStatus.Delivered,
                Subtotal = headphone.Price + charger.Price,
                ShippingFee = 0,
                DiscountAmount = 0,
                TotalAmount = headphone.Price + charger.Price,
                Notes = "Please deliver during business hours.",
                TrackingNumber = "VNPOST-992831201",
                CreatedAt = pastDate,
                Payment = new Payment
                {
                    Amount = headphone.Price + charger.Price,
                    Method = PaymentMethod.CreditCard,
                    Status = PaymentStatus.Completed,
                    TransactionCode = "TXN-DEMO-PAY-01",
                    PaymentDate = pastDate,
                    CreatedAt = pastDate
                }
            };
            order1.Items.Add(new OrderItem
            {
                ProductId = headphone.Id,
                ProductName = headphone.Name,
                ProductSku = headphone.Sku,
                ProductImageUrl = headphone.Images.FirstOrDefault()?.ImageUrl,
                UnitPrice = headphone.Price,
                Quantity = 1,
                TotalPrice = headphone.Price,
                CreatedAt = pastDate
            });
            order1.Items.Add(new OrderItem
            {
                ProductId = charger.Id,
                ProductName = charger.Name,
                ProductSku = charger.Sku,
                ProductImageUrl = charger.Images.FirstOrDefault()?.ImageUrl,
                UnitPrice = charger.Price,
                Quantity = 1,
                TotalPrice = charger.Price,
                CreatedAt = pastDate
            });

            // Order 2: Shipped recent order
            var recentDate = DateTime.UtcNow.AddDays(-2);
            var order2 = new Order
            {
                OrderNumber = "ORD-20261117-48201",
                UserId = demoCustomer.Id,
                RecipientName = demoCustomer.FullName,
                PhoneNumber = demoCustomer.PhoneNumber ?? "+84 988 765 432",
                ShippingAddress = "123 Nguyen Hue Boulevard, Ben Nghe Ward, District 1, Ho Chi Minh City",
                Status = OrderStatus.Shipped,
                Subtotal = keyboard.Price,
                ShippingFee = 0,
                DiscountAmount = 0,
                TotalAmount = keyboard.Price,
                TrackingNumber = "GHN-882914102",
                CreatedAt = recentDate,
                Payment = new Payment
                {
                    Amount = keyboard.Price,
                    Method = PaymentMethod.MoMo,
                    Status = PaymentStatus.Completed,
                    TransactionCode = "TXN-DEMO-MOMO-02",
                    PaymentDate = recentDate,
                    CreatedAt = recentDate
                }
            };
            order2.Items.Add(new OrderItem
            {
                ProductId = keyboard.Id,
                ProductName = keyboard.Name,
                ProductSku = keyboard.Sku,
                ProductImageUrl = keyboard.Images.FirstOrDefault()?.ImageUrl,
                UnitPrice = keyboard.Price,
                Quantity = 1,
                TotalPrice = keyboard.Price,
                CreatedAt = recentDate
            });

            await context.Orders.AddRangeAsync(order1, order2);

            // Add reviews for delivered product
            context.Reviews.Add(new Review
            {
                ProductId = headphone.Id,
                UserId = demoCustomer.Id,
                Rating = 5,
                Comment = "Outstanding soundstage and ANC quality! Battery easily lasted through an entire week of work and travel.",
                IsApproved = true,
                IsVerifiedPurchase = true,
                CreatedAt = pastDate.AddDays(3)
            });

            context.Reviews.Add(new Review
            {
                ProductId = charger.Id,
                UserId = demoCustomer.Id,
                Rating = 5,
                Comment = "Incredibly compact for 140W. Powers my MacBook Pro and iPhone simultaneously with barely any warmth.",
                IsApproved = true,
                IsVerifiedPurchase = true,
                CreatedAt = pastDate.AddDays(4)
            });

            await context.SaveChangesAsync();
        }
    }
}
