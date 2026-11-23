FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY src ./src

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npm run db:deploy && node src/server.js"]

