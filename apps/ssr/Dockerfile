# Build context is the repository root, because the app depends on packages/ui.
FROM node:22 AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/csr/package.json apps/csr/
COPY apps/ssr/package.json apps/ssr/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile
COPY apps/ssr apps/ssr
COPY packages/ui packages/ui
RUN pnpm --filter @ssr/ssr build

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/ssr/.next/standalone ./
COPY --from=build /repo/apps/ssr/.next/static apps/ssr/.next/static
USER node
ENV PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "apps/ssr/server.js"]
