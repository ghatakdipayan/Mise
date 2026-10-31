# Mise on Cloud Run: one container serves the app, /api/ai (Gemini) and /swiggy-api.

# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# .env.production (written by deploy.sh) supplies the public Firebase web config.
RUN npm run build

# ---- run ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
USER node
EXPOSE 8080
CMD ["node", "dist-server/index.mjs"]
