# ======================
# Stage 1: Dependencies
# ======================

# Use node version 22.12.0
FROM node:22.16.0-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS dependencies

LABEL maintainer="Hitesh Sachdeva <hsachdeva9@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# ======================
# Stage 2: Production Image
# ======================
FROM node:22.16.0-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS production

# Set production environment
ENV NODE_ENV=production \
    PORT=8080

LABEL maintainer="Hitesh Sachdeva <hsachdeva9@myseneca.ca>"
LABEL description="Fragments node.js microservice"

WORKDIR /app

# Copy node_modules from dependencies stage
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules

# Copy application source (use .dockerignore to exclude unnecessary files)
COPY --chown=node:node ./src ./src
COPY --chown=node:node package*.json ./

# Copy htpasswd file for HTTP Basic Auth
COPY --chown=node:node ./tests/.htpasswd ./tests/.htpasswd

# Switch to non-root user
USER node

# Expose the application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=3m --timeout=30s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Start the application
CMD ["node", "src/index.js"]
