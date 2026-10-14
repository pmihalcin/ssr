using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Orders.Api.Tests;

public class RecentOrdersTests(OrdersApiFactory factory) : IClassFixture<OrdersApiFactory>
{
    [Fact]
    public async Task Returns_401_without_an_access_token()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/orders/recent");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Returns_401_for_a_token_issued_for_another_audience()
    {
        var client = ClientWithToken(factory.IssueAccessToken(audience: "account"));

        var response = await client.GetAsync("/orders/recent");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Returns_the_ten_most_recent_orders_newest_first()
    {
        var client = ClientWithToken(factory.IssueAccessToken());

        var orders = await client.GetFromJsonAsync<OrderResponse[]>("/orders/recent");

        Assert.NotNull(orders);
        Assert.Equal(10, orders.Length);
        Assert.Equal("ORD-1012", orders[0].Number);
        Assert.Equal("ORD-1003", orders[^1].Number);
        Assert.Equal(orders.OrderByDescending(o => o.PlacedAt).Select(o => o.Number), orders.Select(o => o.Number));
    }

    [Fact]
    public async Task Each_order_has_a_status_a_total_and_its_line_items()
    {
        var client = ClientWithToken(factory.IssueAccessToken());

        var orders = await client.GetFromJsonAsync<OrderResponse[]>("/orders/recent");

        var newest = orders![0];
        Assert.Equal("Pending", newest.Status);
        Assert.Equal("Mila Novak", newest.Customer);
        Assert.Equal(
            [new LineItemResponse("Mechanical keyboard", 1, 129.00m), new LineItemResponse("USB-C cable", 3, 9.50m)],
            newest.LineItems);
        Assert.Equal(157.50m, newest.Total);
    }

    private HttpClient ClientWithToken(string token)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private record OrderResponse(
        string Id, string Number, string Customer, string Status, DateTimeOffset PlacedAt, decimal Total, LineItemResponse[] LineItems);

    private record LineItemResponse(string Product, int Quantity, decimal UnitPrice);
}
