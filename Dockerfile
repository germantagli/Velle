# Velle Backend - Build desde raíz del repo
FROM node:20-slim AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npx prisma generate
RUN npm run build

# Production
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY backend/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
