# Build context is the repository root, because the SPA depends on packages/ui.
FROM node:22 AS spa
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/csr/package.json apps/csr/
COPY apps/ssr/package.json apps/ssr/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile
COPY apps/csr apps/csr
COPY packages/ui packages/ui
RUN pnpm --filter @ssr/csr build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY services/bff/src/Orders.Bff/Orders.Bff.csproj src/Orders.Bff/
RUN dotnet restore src/Orders.Bff/Orders.Bff.csproj
COPY services/bff/src/ src/
RUN dotnet publish src/Orders.Bff/Orders.Bff.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
COPY --from=spa /repo/apps/csr/dist wwwroot
USER $APP_UID
ENTRYPOINT ["dotnet", "Orders.Bff.dll"]
