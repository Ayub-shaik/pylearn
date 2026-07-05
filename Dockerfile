# syntax=docker/dockerfile:1

FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

# ---- deps: install workspace deps with lockfile ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- build: compile the web app to static assets ----
FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN pnpm --filter @pylearn/web build

# ---- runtime: serve static build with nginx ----
FROM nginx:1.27-alpine AS runtime
COPY infra/nginx/pylearn-web.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
