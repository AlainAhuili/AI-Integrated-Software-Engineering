# Release candidate image. Built once in the commit stage, then the same image is
# tested in the acceptance stage and promoted unchanged to release.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_FILE=/app/data/db.json
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY src ./src
COPY public ./public
COPY scripts/create-agency.js ./scripts/create-agency.js

# Records which commit this build came from; reported by GET /healthz.
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
LABEL org.opencontainers.image.revision=$APP_VERSION \
      org.opencontainers.image.title="reputation-widget"

RUN mkdir -p /app/data && chown node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
