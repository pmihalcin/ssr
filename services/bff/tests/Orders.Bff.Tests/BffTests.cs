using Microsoft.AspNetCore.Http;
using System.Net;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Orders.Bff.Tests;

public class BffTests(BffFactory factory) : IClassFixture<BffFactory>
{
    private HttpClient NewClient() =>
        factory.CreateClient(new() { AllowAutoRedirect = false });

    [Fact]
    public async Task Unauthenticated_api_calls_get_401_instead_of_a_login_redirect()
    {
        factory.ApiRequests.Clear();
        var response = await NewClient().GetAsync("/api/orders/recent");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(factory.ApiRequests);
    }

    [Fact]
    public async Task Unauthenticated_visits_to_the_app_are_redirected_to_keycloak()
    {
        var response = await NewClient().GetAsync("/");

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        var location = response.Headers.Location!.ToString();
        Assert.StartsWith(BffFactory.AuthorizationEndpoint, location);
        Assert.Contains("response_type=code", location);
        Assert.Contains("code_challenge_method=S256", location);
        Assert.Contains("client_id=csr-bff", location);
    }

    [Fact]
    public async Task Unauthenticated_deep_links_return_to_the_same_page_after_login()
    {
        var response = await NewClient().GetAsync("/orders/ord_1012?latency=1500");

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        var location = response.Headers.Location!;
        Assert.StartsWith(BffFactory.AuthorizationEndpoint, location.ToString());
        var state = System.Web.HttpUtility.ParseQueryString(location.Query)["state"]!;
        var options = factory.Services.GetRequiredService<IOptionsMonitor<OpenIdConnectOptions>>()
            .Get(OpenIdConnectDefaults.AuthenticationScheme);
        Assert.Equal("/orders/ord_1012?latency=1500", options.StateDataFormat.Unprotect(state)!.RedirectUri);
    }

    [Fact]
    public async Task Api_calls_are_proxied_with_the_users_access_token_and_without_the_session_cookie()
    {
        factory.ApiRequests.Clear();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/orders/recent");
        request.Headers.Add("Cookie", factory.SessionCookieFor("the-access-token"));

        var response = await NewClient().SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var forwarded = Assert.Single(factory.ApiRequests);
        Assert.Equal("http://api.test/orders/recent", forwarded.RequestUri!.ToString());
        Assert.Equal("Bearer the-access-token", forwarded.Headers.Authorization!.ToString());
        Assert.False(forwarded.Headers.Contains("Cookie"));
    }

    [Fact]
    public async Task Api_calls_pass_the_simulated_latency_on_to_the_api()
    {
        factory.ApiRequests.Clear();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/orders/summary");
        request.Headers.Add("Cookie", factory.SessionCookieFor("the-access-token"));
        request.Headers.Add("X-Simulated-Latency", "1500");

        await NewClient().SendAsync(request);

        var forwarded = Assert.Single(factory.ApiRequests);
        Assert.Equal(["1500"], forwarded.Headers.GetValues("X-Simulated-Latency"));
    }

    [Fact]
    public async Task A_token_expiring_within_30_seconds_is_refreshed_before_proxying_and_the_cookie_is_updated()
    {
        factory.ApiRequests.Clear();
        factory.Keycloak.RefreshRequests.Clear();
        factory.Keycloak.RejectRefresh = false;
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/orders/recent");
        request.Headers.Add("Cookie", factory.SessionCookieFor("old-access-token", DateTimeOffset.UtcNow.AddSeconds(10), "the-refresh-token"));

        var response = await NewClient().SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var refresh = Assert.Single(factory.Keycloak.RefreshRequests);
        Assert.Equal("refresh_token", refresh["grant_type"]);
        Assert.Equal("the-refresh-token", refresh["refresh_token"]);
        Assert.Equal("Bearer fresh-access-token", Assert.Single(factory.ApiRequests).Headers.Authorization!.ToString());
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), cookie => cookie.StartsWith("csr.session="));
    }

    [Fact]
    public async Task A_token_with_plenty_of_lifetime_left_is_not_refreshed()
    {
        factory.ApiRequests.Clear();
        factory.Keycloak.RefreshRequests.Clear();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/orders/recent");
        request.Headers.Add("Cookie", factory.SessionCookieFor("the-access-token", DateTimeOffset.UtcNow.AddMinutes(4), "the-refresh-token"));

        await NewClient().SendAsync(request);

        Assert.Empty(factory.Keycloak.RefreshRequests);
        Assert.Equal("Bearer the-access-token", Assert.Single(factory.ApiRequests).Headers.Authorization!.ToString());
    }

    [Fact]
    public async Task A_failed_refresh_ends_the_session_with_a_401_and_does_not_reach_the_api()
    {
        factory.ApiRequests.Clear();
        factory.Keycloak.RejectRefresh = true;
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/orders/recent");
        request.Headers.Add("Cookie", factory.SessionCookieFor("old-access-token", DateTimeOffset.UtcNow.AddSeconds(-5), "expired-refresh-token"));

        var response = await NewClient().SendAsync(request);
        factory.Keycloak.RejectRefresh = false;

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(factory.ApiRequests);
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), cookie => cookie.StartsWith("csr.session=;"));
    }

    [Fact]
    public void The_session_cookie_is_httpOnly_secure_and_same_site()
    {
        var cookie = factory.Services.GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(CookieAuthenticationDefaults.AuthenticationScheme).Cookie;

        Assert.True(cookie.HttpOnly);
        Assert.Equal(CookieSecurePolicy.Always, cookie.SecurePolicy);
        Assert.Equal(SameSiteMode.Lax, cookie.SameSite);
    }

    [Fact]
    public async Task Login_ignores_return_urls_that_leave_the_site()
    {
        var response = await NewClient().GetAsync("/bff/login?returnUrl=//evil.example");

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.DoesNotContain("evil.example", Uri.UnescapeDataString(response.Headers.Location!.ToString()));
    }
}
