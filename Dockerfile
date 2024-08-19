# Stage 1: Build the React client 
FROM node:18 as client
COPY client/ /app/client
COPY shared/models/ /app/shared/models
WORKDIR /app/client
RUN npm install
RUN npm run build

# Stage 2: Build the Node.js server app
FROM node:18 as server
WORKDIR /app
# copy package.json and packages-lock.json to install dependencies
COPY server/ /app/server/
COPY shared/models/ /app/shared/models
RUN cd /app/server && npm install && npx tsc
# create a version.json file from current date to store the version of the app

FROM node:18 as final
WORKDIR /app
COPY --from=server /app/server/out/server/src /app/server/src
COPY --from=server /app/server/tsconfig.json /app/server
COPY --from=server /app/server/out/shared/models /app/shared/models
COPY --from=server /app/server/node_modules /app/node_modules
COPY --from=client /app/client/build ./client/build
COPY server/config.yaml /app/server/config.yaml
RUN echo "{\"version\": \"$(date)\"}" > /app/server/version.json

EXPOSE 3000
CMD ["node", "server/src/server.js"]