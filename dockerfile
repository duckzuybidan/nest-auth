
FROM node:20 AS builder

WORKDIR /app


COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated /app/generated
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]

