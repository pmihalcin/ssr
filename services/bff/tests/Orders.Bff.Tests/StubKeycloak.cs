using System.Net;
using System.Text;

namespace Orders.Bff.Tests;

/// <summary>Plays Keycloak's token endpoint: either issues new tokens or rejects the refresh token.</summary>
public class StubKeycloak : HttpMessageHandler
{
    public bool RejectRefresh { get; set; }

    public List<Dictionary<string, string>> RefreshRequests { get; } = [];

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var form = (await request.Content!.ReadAsStringAsync(cancellationToken))
            .Split('&')
            .Select(pair => pair.Split('=', 2))
            .ToDictionary(pair => pair[0], pair => Uri.UnescapeDataString(pair[1]));
        RefreshRequests.Add(form);

        if (RejectRefresh)
        {
            return new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent("""{"error":"invalid_grant"}""", Encoding.UTF8, "application/json"),
            };
        }
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                """{"access_token":"fresh-access-token","refresh_token":"fresh-refresh-token","expires_in":300}""",
                Encoding.UTF8, "application/json"),
        };
    }
}
