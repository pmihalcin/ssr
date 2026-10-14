namespace Orders.Api.Orders;

public enum OrderStatus
{
    Pending,
    Paid,
    Shipped,
    Delivered,
    Cancelled,
}

public record LineItem(string Product, int Quantity, decimal UnitPrice);

public record Order(
    string Id,
    string Number,
    string Customer,
    OrderStatus Status,
    DateTimeOffset PlacedAt,
    IReadOnlyList<LineItem> LineItems)
{
    public decimal Total => LineItems.Sum(item => item.Quantity * item.UnitPrice);
}
