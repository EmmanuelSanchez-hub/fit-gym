# =============================================================================
# FitGym Pro - Dockerfile (Multi-stage Build)
# =============================================================================
# Build: docker build -t fitgym-pro .
# Run:   docker run -p 3000:3000 fitgym-pro
# =============================================================================

# ---- Stage 1: Base image ----
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# ---- Stage 2: Install dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --production --ignore-scripts

# ---- Stage 3: Build application ----
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Stage 4: Production runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/db ./db

# Copy node_modules for prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Generate Prisma client
RUN npx prisma generate

# Ensure data directory exists for WhatsApp session
RUN mkdir -p /app/data/whatsapp && chown nextjs:nodejs /app/data/whatsapp

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]