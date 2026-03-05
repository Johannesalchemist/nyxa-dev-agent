FROM node:20-alpine AS build
WORKDIR /app
COPY modules/amuse_events/ ./modules/amuse_events/
WORKDIR /app/modules/amuse_events/webapp
RUN npm install
RUN npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app

# Compiled layout:
#   dist/amuse_events.*.js   (module files)
#   dist/webapp/server.js    (entry point, requires ../amuse_events.*)
COPY --from=build /app/modules/amuse_events/webapp/dist/ ./dist/
COPY --from=build /app/modules/amuse_events/webapp/public ./dist/webapp/public
COPY --from=build /app/modules/amuse_events/webapp/node_modules ./node_modules

ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/webapp/server.js"]
