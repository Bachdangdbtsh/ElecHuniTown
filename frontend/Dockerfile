FROM node:24-bookworm-slim AS dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

FROM dev AS builder
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG INTERNAL_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
RUN npm run build

FROM node:24-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]

