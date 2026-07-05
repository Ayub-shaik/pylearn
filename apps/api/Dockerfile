# syntax=docker/dockerfile:1

FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS runtime
COPY --from=deps /repo /repo
COPY . .
WORKDIR /repo/apps/api
# node:20-slim already includes an unprivileged "node" user (uid 1000).
# esbuild writes dist/ here at container start, so it needs to be writable.
RUN chown -R node:node /repo
USER node
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:8081/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["pnpm", "start"]
