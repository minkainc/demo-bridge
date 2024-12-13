# Use the official Node.js image as the base image
FROM node:20.17.0-alpine3.20

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json ./
COPY yarn.lock ./yarn.lock

# install python as it is needed for node-gyp
RUN apk add --no-cache python3 py-setuptools bash make g++ git

# Install dependencies
RUN yarn install

# Copy the rest of the application code
COPY src ./src

# Remove any stray .env file
RUN rm -f .env
RUN rm -f ./src/.env

# Expose the port the app runs on
EXPOSE 8080
EXPOSE 3150

ENTRYPOINT ["/usr/local/bin/node", "/app/src/index.js"]

# Start the application
CMD ["/usr/local/bin/node", "--enable-source-maps", "/app/src/index.js"]
