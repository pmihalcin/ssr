using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Orders.Api.Tests;

public class RevenueSummaryTests(OrdersApiFactory factory) : IClassFixture<OrdersApiFactory>
{
    [Fact]
    public async Task Returns_401_without_an_access_token()
    {
        var response = await factory.CreateClient().GetAsync("/orders/summary");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Summarises_total_revenue_order_count_and_average_over_the_seeded_orders()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", factory.IssueAccessToken());

        var summary = await client.GetFromJsonAsync<SummaryResponse>("/orders/summary");

        Assert.NotNull(summary);
        Assert.Equal(12, summary.OrderCount);
        Assert.Equal(3_198.30m, summary.TotalRevenue);
        Assert.Equal(266.53m, summary.AverageOrderValue);
    }

    private record SummaryResponse(decimal TotalRevenue, int OrderCount, decimal AverageOrderValue);
}
