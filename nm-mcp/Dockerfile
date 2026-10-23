# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV MCP_PORT=8765
ENV MCP_HOST=127.0.0.1

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Usuário não-root para segurança
USER node

EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8765/healthz || exit 1

CMD ["node", "dist/index.js"]
