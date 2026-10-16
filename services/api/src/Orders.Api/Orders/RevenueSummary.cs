namespace Orders.Api.Orders;

public record RevenueSummary(decimal TotalRevenue, int OrderCount, decimal AverageOrderValue)
{
    public static RevenueSummary Of(IReadOnlyCollection<Order> orders)
    {
        var total = orders.Sum(order => order.Total);
        var average = orders.Count == 0 ? 0m : Math.Round(total / orders.Count, 2, MidpointRounding.AwayFromZero);
        return new RevenueSummary(total, orders.Count, average);
    }
}
