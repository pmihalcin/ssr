using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;

namespace Orders.Bff;

/// <summary>
/// Keeps the user's access token fresh inside the session cookie. A token that expires within
/// <see cref="Window"/> is traded for a new one with the refresh token; if Keycloak refuses, the
/// session is dropped so the next request gets a 401 and the SPA starts a clean login.
/// </summary>
public static class TokenRefresh
{
    public static readonly TimeSpan Window = TimeSpan.FromSeconds(30);

    public static async Task ValidateAsync(CookieValidatePrincipalContext context)
    {
        var expiresAt = context.Properties.GetTokenValue("expires_at");
        if (!DateTimeOffset.TryParse(expiresAt, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var expires)
            || expires - DateTimeOffset.UtcNow > Window)
        {
            return;
        }

        var refreshed = await RefreshAsync(context);
        if (!refreshed)
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }
    }

    private static async Task<bool> RefreshAsync(CookieValidatePrincipalContext context)
    {
        var refreshToken = context.Properties.GetTokenValue("refresh_token");
        if (refreshToken is null) return false;

        var oidc = context.HttpContext.RequestServices.GetRequiredService<IOptionsMonitor<OpenIdConnectOptions>>()
            .Get(OpenIdConnectDefaults.AuthenticationScheme);
        try
        {
            var configuration = oidc.Configuration
                ?? await oidc.ConfigurationManager!.GetConfigurationAsync(context.HttpContext.RequestAborted);
            using var response = await oidc.Backchannel.PostAsync(
                configuration.TokenEndpoint,
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["grant_type"] = "refresh_token",
                    ["refresh_token"] = refreshToken,
                    ["client_id"] = oidc.ClientId!,
                    ["client_secret"] = oidc.ClientSecret!,
                }),
                context.HttpContext.RequestAborted);
            if (!response.IsSuccessStatusCode) return false;

            using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(context.HttpContext.RequestAborted));
            var root = body.RootElement;
            var tokens = new List<AuthenticationToken>
            {
                new() { Name = "access_token", Value = root.GetProperty("access_token").GetString()! },
                new() { Name = "refresh_token", Value = root.TryGetProperty("refresh_token", out var rotated) ? rotated.GetString()! : refreshToken },
                new()
                {
                    Name = "expires_at",
                    Value = DateTimeOffset.UtcNow.AddSeconds(root.GetProperty("expires_in").GetInt32())
                        .ToString("o", CultureInfo.InvariantCulture),
                },
            };
            var idToken = context.Properties.GetTokenValue("id_token");
            if (idToken is not null) tokens.Add(new AuthenticationToken { Name = "id_token", Value = idToken });
            context.Properties.StoreTokens(tokens);
            context.ShouldRenew = true;
            return true;
        }
        catch (Exception exception) when (exception is HttpRequestException or JsonException or KeyNotFoundException or InvalidOperationException)
        {
            return false;
        }
    }
}
