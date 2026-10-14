# The CSR app also uses a BFF

Both the CSR app and the SSR app keep tokens out of the browser behind a Backend-for-Frontend, so the only thing the comparison varies is the rendering mode. A CSR app that stores tokens in browser storage is the more common setup, but it would mix up two separate choices (where rendering happens and where tokens live) and wrongly suggest that SSR is what makes the BFF possible. The CSR app's BFF is an ASP.NET Core service that handles the OIDC login, issues an httpOnly session cookie, serves the SPA's static files and proxies `/api` to the API with YARP, keeping everything same-origin.

## Considered Options

- **CSR with tokens in the browser vs SSR with a BFF**: rejected because it mixes up rendering and token handling. A CSR app that stores tokens in the browser may be added later as a separate, explicitly labelled variant.
- **A Node BFF for the CSR app**: rejected in favour of ASP.NET Core, which matches the API's stack and the common real-world SPA + .NET pattern.
- **Duende BFF**: rejected because of its licence. OIDC and YARP are wired up by hand instead.
