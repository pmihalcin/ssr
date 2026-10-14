using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Orders.Api.Tests;

/// <summary>
/// Runs the API with its real JWT validation, but trusts a local signing key
/// in place of Keycloak's, so tests can issue their own access tokens.
/// </summary>
public class OrdersApiFactory : WebApplicationFactory<Program>
{
    public const string Issuer = "http://keycloak.test/realms/ssr";
    public const string Audience = "orders-api";

    private readonly RsaSecurityKey _signingKey = new(RSA.Create(2048)) { KeyId = "test-key" };

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Keycloak:Authority", Issuer);
        builder.UseSetting("Keycloak:Audience", Audience);
        builder.UseSetting("Keycloak:RequireHttpsMetadata", "false");

        builder.ConfigureTestServices(services =>
            services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                var configuration = new OpenIdConnectConfiguration { Issuer = Issuer };
                configuration.SigningKeys.Add(_signingKey);
                options.Configuration = configuration;
            }));
    }

    public string IssueAccessToken(string audience = Audience) =>
        new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = Issuer,
            Audience = audience,
            Subject = new ClaimsIdentity([new Claim("sub", "test-user"), new Claim("preferred_username", "alice")]),
            Expires = DateTime.UtcNow.AddMinutes(5),
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.RsaSha256),
        });
}
