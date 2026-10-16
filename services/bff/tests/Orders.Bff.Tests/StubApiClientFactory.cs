using System.Net;
using Yarp.ReverseProxy.Forwarder;

namespace Orders.Bff.Tests;

/// <summary>Answers proxied requests with a canned response and records what the API would have received.</summary>
public class StubApiClientFactory(List<HttpRequestMessage> received) : IForwarderHttpClientFactory
{
    public HttpMessageInvoker CreateClient(ForwarderHttpClientContext context) => new(new StubHandler(received));

    private class StubHandler(List<HttpRequestMessage> received) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            received.Add(request);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("[]", System.Text.Encoding.UTF8, "application/json"),
            });
        }
    }
}
