using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Yarp.ReverseProxy.Forwarder;

namespace Orders.Bff.Tests;

/// <summary>
/// Runs the BFF with its real authentication and proxy pipeline, but with a canned
/// OIDC configuration and a stub in place of the API, so no Keycloak or API is needed.
/// </summary>
public class BffFactory : WebApplicationFactory<Program>
{
    public const string AuthorizationEndpoint = "http://keycloak.test/realms/ssr/protocol/openid-connect/auth";

    public const string TokenEndpoint = "http://keycloak.test/realms/ssr/protocol/openid-connect/token";

    public List<HttpRequestMessage> ApiRequests { get; } = [];

    /// <summary>Answers the BFF's calls to Keycloak's token endpoint.</summary>
    public StubKeycloak Keycloak { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Api:BaseAddress", "http://api.test");
        builder.UseSetting("Session:InsecureCookies", "false");

        builder.ConfigureTestServices(services =>
        {
            services.Configure<OpenIdConnectOptions>(OpenIdConnectDefaults.AuthenticationScheme, options =>
                options.Configuration = new OpenIdConnectConfiguration
                {
                    Issuer = "http://keycloak.test/realms/ssr",
                    AuthorizationEndpoint = AuthorizationEndpoint,
                    TokenEndpoint = TokenEndpoint,
                });
            services.PostConfigure<OpenIdConnectOptions>(OpenIdConnectDefaults.AuthenticationScheme, options =>
                options.Backchannel = new HttpClient(Keycloak));
            services.AddSingleton<IForwarderHttpClientFactory>(new StubApiClientFactory(ApiRequests));
        });
    }

    /// <summary>Creates the encrypted session cookie the BFF would have issued after a login.</summary>
    public string SessionCookieFor(string accessToken, DateTimeOffset? expiresAt = null, string? refreshToken = null)
    {
        var options = Services.GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(CookieAuthenticationDefaults.AuthenticationScheme);
        var properties = new AuthenticationProperties { IssuedUtc = DateTimeOffset.UtcNow, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1) };
        var tokens = new List<AuthenticationToken> { new() { Name = "access_token", Value = accessToken } };
        if (expiresAt is not null)
            tokens.Add(new AuthenticationToken { Name = "expires_at", Value = expiresAt.Value.ToString("o") });
        if (refreshToken is not null)
            tokens.Add(new AuthenticationToken { Name = "refresh_token", Value = refreshToken });
        properties.StoreTokens(tokens);
        var ticket = new AuthenticationTicket(
            new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "test-user")], "test")),
            properties,
            CookieAuthenticationDefaults.AuthenticationScheme);
        return $"{options.Cookie.Name}={options.TicketDataFormat.Protect(ticket)}";
    }
}
