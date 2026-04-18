FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p /app/videos && chown -R node:node /app

EXPOSE 3003

USER node

ENV VIDEOS_DIR=/app/videos

CMD ["node", "src/index.js"]
