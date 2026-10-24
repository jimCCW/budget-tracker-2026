FROM node:24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN npm install -g pnpm@11.1.3 && pnpm install --frozen-lockfile
COPY . .
RUN npx prisma generate && pnpm build

FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/index.js"]
