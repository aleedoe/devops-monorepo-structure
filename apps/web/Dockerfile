# ============================================================================
# MULTI-STAGE DOCKERFILE FOR NEXT.JS (apps/web)
# ============================================================================
# This Dockerfile uses `turbo prune` to create a minimal monorepo subset
# containing ONLY apps/web + packages/validators, keeping the final image
# as small as possible (~50MB vs ~500MB+ for a naive copy).
#
# BUILD CONTEXT: This file must be built from the MONOREPO ROOT, not apps/web.
#   docker build -f apps/web/Dockerfile .
# ============================================================================

# ── Global Args ──────────────────────────────────────────────────────────────
ARG NODE_VERSION=22

# ┌──────────────────────────────────────────────────────────────────────────┐
# │ STAGE 1: PRUNER                                                         │
# │ Uses turbo prune to generate a minimal monorepo subset.                 │
# │ Output: /app/out/json/   → pruned package.json + lockfile               │
# │         /app/out/full/   → pruned source code                           │
# └──────────────────────────────────────────────────────────────────────────┘
FROM node:${NODE_VERSION}-alpine AS pruner

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
RUN pnpm add -g turbo@^2

WORKDIR /app
COPY . .

# turbo prune @repo/web --docker generates:
#   out/json/  → Only the package.json files + lockfile for @repo/web and
#                its internal dependencies (packages/validators)
#   out/full/  → The actual source code for the pruned workspaces
RUN turbo prune @repo/web --docker

# ┌──────────────────────────────────────────────────────────────────────────┐
# │ STAGE 2: INSTALLER                                                      │
# │ Install dependencies using ONLY the pruned lockfile + package.json.     │
# │ This stage is Docker-layer-cached — it only re-runs when deps change.   │
# └──────────────────────────────────────────────────────────────────────────┘
FROM node:${NODE_VERSION}-alpine AS installer

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy the pruned package.json files + lockfile FIRST (cache-friendly layer)
COPY --from=pruner /app/out/json/ .

# Install dependencies — this layer is cached unless lockfile changes
RUN pnpm install --frozen-lockfile

# ┌──────────────────────────────────────────────────────────────────────────┐
# │ STAGE 3: BUILDER                                                        │
# │ Copy source code and build the Next.js application.                     │
# │ turbo will build packages/validators first (dependsOn: ["^build"]),     │
# │ then apps/web — all resolved automatically.                             │
# └──────────────────────────────────────────────────────────────────────────┘
FROM node:${NODE_VERSION}-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy installed node_modules from installer stage
COPY --from=installer /app/ .

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .

# Build the entire dependency graph (validators → web)
RUN pnpm turbo run build --filter=@repo/web

# ┌──────────────────────────────────────────────────────────────────────────┐
# │ STAGE 4: RUNNER                                                         │
# │ Production image — contains ONLY the standalone Next.js output.         │
# │ Runs as non-root user for security.                                     │
# └──────────────────────────────────────────────────────────────────────────┘
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

# Don't run as root in production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone output (server.js + minimal node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy static assets (CSS, JS bundles, images)
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Copy public directory if it exists (favicon, robots.txt, etc.)
# Using shell form because COPY doesn't support conditional logic
RUN mkdir -p ./apps/web/public
COPY --from=builder /app/apps/web/public ./apps/web/public/

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

EXPOSE 3000

# Next.js standalone outputs server.js in the app directory
CMD ["node", "apps/web/server.js"]
