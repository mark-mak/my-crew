# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all deps (including devDeps needed for tsc)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm db:generate

# Copy source and compile
COPY . .
RUN pnpm build


# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifests and the full node_modules from builder, then prune devDeps
COPY --chown=nodejs:nodejs package.json pnpm-lock.yaml ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
RUN pnpm prune --prod

# Copy compiled output and Prisma artifacts
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nodejs:nodejs prisma ./prisma

USER nodejs

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
