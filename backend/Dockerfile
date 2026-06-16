# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm (must match version used to generate pnpm-lock.yaml)
RUN corepack enable && corepack prepare pnpm@8.9.0 --activate

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

# Copy everything needed to run the app from the builder
# (node_modules includes the Prisma-generated client from db:generate)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

USER nodejs

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
