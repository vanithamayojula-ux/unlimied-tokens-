ARG NODE_IMAGE=node:20-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY shared ./shared
RUN mkdir -p node_modules/@freellmapi/shared && cp -r shared/* node_modules/@freellmapi/shared/
RUN npm install --ignore-scripts || true
RUN npm rebuild better-sqlite3 sharp || true

COPY . .
RUN mkdir -p node_modules/@freellmapi/shared && cp -r shared/* node_modules/@freellmapi/shared/
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV FREELLMAPI_INSTALL_METHOD=docker

COPY --from=deps --chown=node:node /app/package.json ./
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=deps --chown=node:node /app/shared ./shared
COPY --from=deps --chown=node:node /app/dist ./dist

RUN mkdir -p /app/data /app/server/data && chown -R node:node /app/data /app/server/data

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER root

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/ping').then((res) => { if (!res.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "dist/index.js"]
