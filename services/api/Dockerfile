FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/Orders.Api/Orders.Api.csproj src/Orders.Api/
RUN dotnet restore src/Orders.Api/Orders.Api.csproj
COPY src/ src/
RUN dotnet publish src/Orders.Api/Orders.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
ENTRYPOINT ["dotnet", "Orders.Api.dll"]
