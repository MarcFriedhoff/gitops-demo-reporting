# Stage 1: Build the React client app
FROM node:16 as build
WORKDIR /app
COPY client/package.json ./
COPY models/ /models
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Node.js server app
FROM node:16
WORKDIR /app
# copy package.json and packages-lock.json to install dependencies
COPY server/ server/
COPY models/ models/
RUN cd server && npm install && npx tsc
COPY --from=build /app/build ./client/build

EXPOSE 3001
CMD ["node", "server/server.js"]