FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache docker-cli tini

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY backend ./backend

ENV NODE_ENV=production
ENV RUNNER_HOST=0.0.0.0

ENTRYPOINT ["/sbin/tini", "--"]
