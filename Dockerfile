FROM node:20.16.0-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20.16.0-alpine
ENV NODE_ENV=production
USER node
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /usr/src/app/dist ./dist

ENV PORT=8080
EXPOSE 8080
CMD [ "node", "dist/index.js" ]
