# ============================================================================
# MULTI-STAGE DOCKERFILE FOR EXPRESS API (apps/api)
# ============================================================================
# This Dockerfile uses `turbo prune` to create a minimal monorepo subset
# containing ONLY apps/api + packages/validators, keeping the final image
# as small as possible.
#
# BUILD CONTEXT: This file must be built from the MONOREPO ROOT, not apps/api.
#   docker build -f apps/api/Dockerfile .
# ============================================================================

# ── Global Args ──────────────────────────────────────────────────────────────
ARG NODE_VERSION=22

# ┌──────────────────────────────────────────────────────────────────────────┐
# │ STAGE 1: PRUNER                                                         │
# │ Uses turbo prune to generate a minimal monorepo subset for @repo/api.   │
# └──────────────────────────────────────────────────────────────────────────┘
FROM node:${NODE_VERSION}-alpine AS pruner

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
RUN pnpm add -g turbo@^2

WORKDIR /app
COPY . .

# Generate pruned monorepo containing only apps/api + packages/validators
RUN turbo prune @repo/api --docker

# ┌──────────────────────────────────────────────────────────────────────────┐
# │ STAGE 2: INSTALLER                                                      │
# │ Install ALL dependencies (dev included) for the build stage.            │
# └──────────────────────────────────────────────────────────────────────────┘
FROM node:${NODE_VERSION}-alpine AS installer

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy pruned package manifests + lockfile
COPY --from=pruner /app/out/json/ .

# Install all dependencies (including devDependencies for TypeScript build)
RUN pnpm install --frozen-lockfile

# ┌──────────────────────────────────────────────────────────────────────────┐
# │ STAGE 3: BUILDER                                                        │
# │ Compile TypeScript to JavaScript.                                       │
# │ turbo handles build order: packages/validators → apps/api               │
# └──────────────────────────────────────────────────────────────────────────┘
FROM node:${NODE_VERSION}-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy installed deps from installer
COPY --from=installer /app/ .

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build the full dependency graph (validators → api)
RUN pnpm turbo run build --filter=@repo/api

# Prune devDependencies for a leaner production image
RUN pnpm prune --prod

# ┌──────────────────────────────────────────────────────────────────────────┐
# │ STAGE 4: RUNNER                                                         │
# │ Production image — compiled JS + production node_modules only.          │
# │ Runs as non-root user for security.                                     │
# └──────────────────────────────────────────────────────────────────────────┘
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

# Don't run as root in production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy the compiled output and production dependencies
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/validators/dist ./packages/validators/dist
COPY --from=builder /app/packages/validators/package.json ./packages/validators/package.json
COPY --from=builder /app/package.json ./package.json

# Set ownership
RUN chown -R expressjs:nodejs /app

USER expressjs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
