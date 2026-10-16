using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Orders.Api;

namespace Orders.Api.Tests;

public class SimulatedLatencyTests(OrdersApiFactory factory) : IClassFixture<OrdersApiFactory>
{
    [Theory]
    [InlineData("1500", 1500)]
    [InlineData("10000", 10_000)]
    [InlineData("60000", 10_000)]
    public void Parses_milliseconds_and_caps_them_at_ten_seconds(string value, int expectedMilliseconds) =>
        Assert.Equal(TimeSpan.FromMilliseconds(expectedMilliseconds), SimulatedLatency.Parse(value));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("abc")]
    [InlineData("-5")]
    [InlineData("0")]
    [InlineData("1.5")]
    public void Ignores_invalid_values(string? value) => Assert.Null(SimulatedLatency.Parse(value));

    [Fact]
    public async Task Waits_the_requested_time_before_responding()
    {
        var time = new RecordingTimeProvider();
        var client = ClientWith(time);

        var response = await client.SendAsync(Request("1500"));

        Assert.True(response.IsSuccessStatusCode);
        Assert.Equal([TimeSpan.FromMilliseconds(1500)], time.Delays);
    }

    [Fact]
    public async Task Caps_the_wait()
    {
        var time = new RecordingTimeProvider();
        var client = ClientWith(time);

        await client.SendAsync(Request("999999"));

        Assert.Equal([TimeSpan.FromSeconds(10)], time.Delays);
    }

    [Fact]
    public async Task Does_not_wait_without_a_valid_header()
    {
        var time = new RecordingTimeProvider();
        var client = ClientWith(time);

        await client.SendAsync(Request(null));
        await client.SendAsync(Request("nonsense"));

        Assert.Empty(time.Delays);
    }

    private HttpClient ClientWith(TimeProvider time) =>
        factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services => services.Replace(ServiceDescriptor.Singleton(time)))).CreateClient();

    private HttpRequestMessage Request(string? latency)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/orders/summary");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", factory.IssueAccessToken());
        if (latency is not null) request.Headers.Add(SimulatedLatency.HeaderName, latency);
        return request;
    }

    /// <summary>Completes every timer straight away and remembers how long it was asked to wait.</summary>
    private sealed class RecordingTimeProvider : TimeProvider
    {
        public List<TimeSpan> Delays { get; } = [];

        public override ITimer CreateTimer(TimerCallback callback, object? state, TimeSpan dueTime, TimeSpan period)
        {
            Delays.Add(dueTime);
            Task.Run(() => callback(state));
            return new NoopTimer();
        }

        private sealed class NoopTimer : ITimer
        {
            public bool Change(TimeSpan dueTime, TimeSpan period) => true;
            public void Dispose() { }
            public ValueTask DisposeAsync() => ValueTask.CompletedTask;
        }
    }
}
