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

    public List<HttpRequestMessage> ApiRequests { get; } = [];

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
                });
            services.AddSingleton<IForwarderHttpClientFactory>(new StubApiClientFactory(ApiRequests));
        });
    }

    /// <summary>Creates the encrypted session cookie the BFF would have issued after a login.</summary>
    public string SessionCookieFor(string accessToken)
    {
        var options = Services.GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(CookieAuthenticationDefaults.AuthenticationScheme);
        var properties = new AuthenticationProperties();
        properties.StoreTokens([new AuthenticationToken { Name = "access_token", Value = accessToken }]);
        var ticket = new AuthenticationTicket(
            new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "test-user")], "test")),
            properties,
            CookieAuthenticationDefaults.AuthenticationScheme);
        return $"{options.Cookie.Name}={options.TicketDataFormat.Protect(ticket)}";
    }
}
