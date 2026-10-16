using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Orders.Bff;
using Yarp.ReverseProxy.Transforms;

var builder = WebApplication.CreateBuilder(args);

var oidc = builder.Configuration.GetSection("Oidc");
var insecureCookies = builder.Configuration.GetValue<bool>("Session:InsecureCookies");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie(options =>
    {
        options.Cookie.Name = "csr.session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = insecureCookies ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
        // API calls from the SPA must get a plain 401 so it can start the login itself.
        options.Events.OnValidatePrincipal = TokenRefresh.ValidateAsync;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    })
    .AddOpenIdConnect(options =>
    {
        options.Authority = oidc["Authority"];
        options.MetadataAddress = oidc["MetadataAddress"] ?? $"{oidc["Authority"]}/.well-known/openid-configuration";
        options.RequireHttpsMetadata = oidc.GetValue("RequireHttpsMetadata", true);
        options.ClientId = oidc["ClientId"];
        options.ClientSecret = oidc["ClientSecret"];
        options.ResponseType = OpenIdConnectResponseType.Code;
        options.UsePkce = true;
        options.SaveTokens = true;
        options.MapInboundClaims = false;
        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.CallbackPath = "/signin-oidc";
        options.SignedOutCallbackPath = "/signout-callback-oidc";
        options.TokenValidationParameters.NameClaimType = "preferred_username";
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(BffPolicies.SessionCookie, policy => policy
        .AddAuthenticationSchemes(CookieAuthenticationDefaults.AuthenticationScheme)
        .RequireAuthenticatedUser());

builder.Services
    .AddReverseProxy()
    .LoadFromMemory(
        [
            new Yarp.ReverseProxy.Configuration.RouteConfig
            {
                RouteId = "api",
                ClusterId = "api",
                AuthorizationPolicy = BffPolicies.SessionCookie,
                Match = new Yarp.ReverseProxy.Configuration.RouteMatch { Path = "/api/{**catch-all}" },
            },
        ],
        [
            new Yarp.ReverseProxy.Configuration.ClusterConfig
            {
                ClusterId = "api",
                Destinations = new Dictionary<string, Yarp.ReverseProxy.Configuration.DestinationConfig>
                {
                    ["api"] = new() { Address = builder.Configuration["Api:BaseAddress"]! },
                },
            },
        ])
    .AddTransforms(context =>
    {
        context.AddPathRemovePrefix("/api");
        context.AddRequestTransform(async transform =>
        {
            // The browser's session cookie is for the BFF only; the API gets the user's access token instead.
            transform.ProxyRequest.Headers.Remove("Cookie");
            var accessToken = await transform.HttpContext.GetTokenAsync(
                CookieAuthenticationDefaults.AuthenticationScheme, "access_token");
            if (accessToken is not null)
            {
                transform.ProxyRequest.Headers.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            }
        });
    });

var app = builder.Build();

app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/bff/login", (string? returnUrl) =>
    Results.Challenge(
        new AuthenticationProperties { RedirectUri = LocalUrl(returnUrl) },
        [OpenIdConnectDefaults.AuthenticationScheme]));

app.MapPost("/bff/logout", () =>
    Results.SignOut(
        new AuthenticationProperties { RedirectUri = "/" },
        [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]));

app.MapReverseProxy();

// Unauthenticated visits to the app are sent to Keycloak before any of the SPA is served.
app.MapFallbackToFile("index.html").RequireAuthorization();

app.Run();

static string LocalUrl(string? returnUrl) =>
    returnUrl is not null && returnUrl.StartsWith('/') && !returnUrl.StartsWith("//") && !returnUrl.StartsWith("/\\")
        ? returnUrl
        : "/";

public partial class Program;
