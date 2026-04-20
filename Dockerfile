FROM node:22-alpine AS build_frontend
WORKDIR /app/flair-next
COPY flair-next/package*.json ./
RUN npm ci
COPY flair-next/ ./
RUN npm run build

FROM node:22-alpine AS build_server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY --from=build_server /app/server/dist ./server/dist
COPY --from=build_frontend /app/flair-next/dist ./public

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
