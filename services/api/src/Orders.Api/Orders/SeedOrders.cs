namespace Orders.Api.Orders;

/// <summary>Fixed sample Orders, so both apps render the same data on every run.</summary>
public static class SeedOrders
{
    public static readonly IReadOnlyList<Order> All =
    [
        Seed(1001, "Jonas Berg", OrderStatus.Delivered, "2026-09-02T09:14:00Z",
            new LineItem("Standing desk", 1, 489.00m)),
        Seed(1002, "Ana Kovač", OrderStatus.Delivered, "2026-09-05T13:40:00Z",
            new LineItem("Monitor arm", 2, 79.90m), new LineItem("Desk mat", 1, 24.00m)),
        Seed(1003, "Lukas Meyer", OrderStatus.Cancelled, "2026-09-09T17:05:00Z",
            new LineItem("Webcam 4K", 1, 149.00m)),
        Seed(1004, "Sofia Rossi", OrderStatus.Delivered, "2026-09-14T08:22:00Z",
            new LineItem("Noise-cancelling headphones", 1, 299.00m), new LineItem("Headphone stand", 1, 35.00m)),
        Seed(1005, "Tomáš Horák", OrderStatus.Delivered, "2026-09-18T11:51:00Z",
            new LineItem("Ergonomic chair", 1, 645.00m)),
        Seed(1006, "Emma Lindqvist", OrderStatus.Shipped, "2026-09-23T15:30:00Z",
            new LineItem("Laptop stand", 1, 59.00m), new LineItem("USB-C hub", 1, 69.00m), new LineItem("USB-C cable", 2, 9.50m)),
        Seed(1007, "Marek Novotný", OrderStatus.Shipped, "2026-09-27T10:02:00Z",
            new LineItem("27\" monitor", 2, 329.00m)),
        Seed(1008, "Chloé Martin", OrderStatus.Paid, "2026-10-01T19:45:00Z",
            new LineItem("Wireless mouse", 1, 49.00m), new LineItem("Mouse pad", 1, 12.00m)),
        Seed(1009, "Daniel Weber", OrderStatus.Paid, "2026-10-04T07:18:00Z",
            new LineItem("Desk lamp", 1, 89.00m)),
        Seed(1010, "Petra Svoboda", OrderStatus.Paid, "2026-10-07T12:36:00Z",
            new LineItem("Cable tray", 2, 29.00m), new LineItem("Velcro ties (50)", 1, 8.00m)),
        Seed(1011, "Oliver Hughes", OrderStatus.Pending, "2026-10-10T16:09:00Z",
            new LineItem("Docking station", 1, 219.00m)),
        Seed(1012, "Mila Novak", OrderStatus.Pending, "2026-10-12T20:27:00Z",
            new LineItem("Mechanical keyboard", 1, 129.00m), new LineItem("USB-C cable", 3, 9.50m)),
    ];

    private static Order Seed(int number, string customer, OrderStatus status, string placedAt, params LineItem[] lineItems) =>
        new($"ord_{number}", $"ORD-{number}", customer, status, DateTimeOffset.Parse(placedAt), lineItems);
}
