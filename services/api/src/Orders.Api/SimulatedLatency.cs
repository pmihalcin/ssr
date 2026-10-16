namespace Orders.Api;

/// <summary>
/// Makes a request wait before it is handled when it carries a Simulated Latency header,
/// so the effect of slow data on Initial Load can be shown.
/// </summary>
public static class SimulatedLatency
{
    public const string HeaderName = "X-Simulated-Latency";
    public static readonly TimeSpan Max = TimeSpan.FromSeconds(10);

    public static TimeSpan? Parse(string? value)
    {
        if (!int.TryParse(value, out var milliseconds) || milliseconds <= 0) return null;
        var requested = TimeSpan.FromMilliseconds(milliseconds);
        return requested > Max ? Max : requested;
    }

    public static void UseSimulatedLatency(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            if (Parse(context.Request.Headers[HeaderName].FirstOrDefault()) is { } delay)
            {
                var time = context.RequestServices.GetRequiredService<TimeProvider>();
                await Task.Delay(delay, time, context.RequestAborted);
            }
            await next();
        });
}
