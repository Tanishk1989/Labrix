# ----------------------------------------------------
# Stage 1: Dependencies
# ----------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY backend/prisma ./backend/prisma
RUN npm ci

# ----------------------------------------------------
# Migration Runner (contains Prisma CLI and generated client)
# ----------------------------------------------------
FROM deps AS migrator
WORKDIR /app
ENV NODE_ENV=production
ENTRYPOINT ["npx", "prisma", "migrate", "deploy", "--schema=backend/prisma/schema.prisma"]

# ----------------------------------------------------
# Stage 2: Builder
# ----------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_OUTPUT_STANDALONE=true

RUN npx prisma generate --schema=backend/prisma/schema.prisma
RUN npm run build

# ----------------------------------------------------
# Stage 3: Production Runner
# ----------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; else node frontend/server.js; fi"]
