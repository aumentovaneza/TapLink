FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY server/package.json server/yarn.lock* ./
RUN yarn install
COPY server ./
RUN yarn prisma:generate

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
RUN yarn build

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
