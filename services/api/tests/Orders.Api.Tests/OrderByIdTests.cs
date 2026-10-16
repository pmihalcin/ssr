using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Orders.Api.Tests;

public class OrderByIdTests(OrdersApiFactory factory) : IClassFixture<OrdersApiFactory>
{
    [Fact]
    public async Task Returns_401_without_an_access_token()
    {
        var response = await factory.CreateClient().GetAsync("/orders/ord_1012");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Returns_the_order_with_its_status_total_and_line_items()
    {
        var response = await AuthorizedClient().GetAsync("/orders/ord_1012");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<OrderResponse>();
        Assert.Equal("ORD-1012", order!.Number);
        Assert.Equal("Pending", order.Status);
        Assert.Equal(157.50m, order.Total);
        Assert.Equal(
            [new LineItemResponse("Mechanical keyboard", 1, 129.00m), new LineItemResponse("USB-C cable", 3, 9.50m)],
            order.LineItems);
    }

    [Fact]
    public async Task Returns_404_for_an_unknown_id()
    {
        var response = await AuthorizedClient().GetAsync("/orders/ord_9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Does_not_shadow_the_recent_and_summary_endpoints()
    {
        var client = AuthorizedClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/orders/recent")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/orders/summary")).StatusCode);
    }

    private HttpClient AuthorizedClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", factory.IssueAccessToken());
        return client;
    }

    private record OrderResponse(string Id, string Number, string Status, decimal Total, LineItemResponse[] LineItems);

    private record LineItemResponse(string Product, int Quantity, decimal UnitPrice);
}
