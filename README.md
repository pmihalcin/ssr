# SSR vs CSR reference

The same pages built twice, once with Client-Side Rendering and once with Server-Side Rendering, to show what each costs and buys in Initial Load and in token handling. Terms are defined in [`CONTEXT.md`](CONTEXT.md), decisions in [`docs/adr/`](docs/adr/).

## Layout

| Path | What |
| --- | --- |
| `apps/csr` | CSR app: Vite + React SPA |
| `apps/ssr` | SSR app: Next.js App Router |
| `packages/ui` | Shared UI components used by both apps |
| `services/bff` | ASP.NET Core BFF for the CSR app |
| `services/api` | Orders API: ASP.NET Core minimal API (.NET 10) |
| `keycloak` | Keycloak realm imported on startup |

It's a pnpm workspace (`apps/*`, `packages/*`); the .NET services sit alongside it.

## Run it

```sh
docker compose up --build
```

This starts:

- Keycloak on http://localhost:8080 (admin console: `admin` / `admin`) with the `ssr` realm, the `csr-bff` and `ssr-app` clients and the test user `alice` / `alice`
- The API on http://localhost:5100

## Get a token and curl the API

The `dev-cli` client allows the password grant, for local use only:

```sh
TOKEN=$(curl -s http://localhost:8080/realms/ssr/protocol/openid-connect/token \
  -d grant_type=password -d client_id=dev-cli -d username=alice -d password=alice \
  | jq -r .access_token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:5100/orders/recent
```

Without the header the API returns `401`. Tokens last 5 minutes.

## API tests

```sh
cd services/api && dotnet test
```
