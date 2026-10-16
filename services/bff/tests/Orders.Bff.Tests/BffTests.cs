using Microsoft.AspNetCore.Http;
using System.Net;
using Microsoft.AspNetCore.Authentication.Cookies;
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
