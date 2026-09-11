# ============================================================
# SchoolSense Backend — Dockerfile (Production)
# ============================================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install all deps (including devDeps for build)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ---------------------------------------------------------------
# Stage 2: Runtime (lean image, no devDependencies)
# ---------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema + generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy built dist
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main"]
