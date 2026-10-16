namespace Orders.Api.Orders;

public static class OrdersEndpoints
{
    private const int RecentCount = 10;

    public static void MapOrders(this IEndpointRouteBuilder app)
    {
        var orders = app.MapGroup("/orders").RequireAuthorization();

        orders.MapGet("/recent", () =>
            SeedOrders.All.OrderByDescending(order => order.PlacedAt).Take(RecentCount));

        orders.MapGet("/summary", () => RevenueSummary.Of(SeedOrders.All));

        orders.MapGet("/{id}", (string id) =>
            SeedOrders.All.FirstOrDefault(order => order.Id == id) is { } order
                ? Results.Ok(order)
                : Results.NotFound());
    }
}
