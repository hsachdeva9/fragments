# Use node version 22.12.0
FROM node:22.16.0-alpine AS build

LABEL maintainer="Hitesh Sachdeva <hsachdeva9@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# explicit path - Copy the package.json and package-lock.json
# files into /app. NOTE: the trailing `/` on `/app/`, which tells Docker
# that app is a directory and not a file.
COPY package*.json /app/

# Install node dependencies defined in package-lock.json
# Only production dependencies for smaller image
RUN npm ci --only=production

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# ======================
# Stage 2: Production Image
# ======================
FROM node:22.16.0-alpine

# Set working directory
WORKDIR /app

# Copy only the node_modules and app files from build stage
COPY --from=build /app /app

# Use non-root user for security
USER node

# We run our service on port 8080
EXPOSE 8080

# Optional: Health check for Docker
HEALTHCHECK --interval=3m --timeout=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

# Start the container by running our server
CMD ["npm", "start"]
