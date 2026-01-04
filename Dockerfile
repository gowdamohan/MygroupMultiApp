# Multi-Tenant Platform - Multi-Stage Docker Build
# Builds both React frontend and Node.js backend

# =============================================================================
# Stage 1: Frontend Build Stage
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files for frontend
COPY package.json package-lock.json ./

# Install frontend dependencies
RUN npm ci --silent

# Copy frontend source code
COPY src/ ./src/
COPY index.html ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig*.json ./

# Build the frontend for production
RUN npm run build

# =============================================================================
# Stage 2: Backend Dependencies Stage
# =============================================================================
FROM node:20-alpine AS backend-deps

WORKDIR /app/backend

# Copy package files for backend
COPY backend/package.json backend/package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production --silent

# =============================================================================
# Stage 3: Production Image
# =============================================================================
FROM node:20-alpine AS production

# Install additional packages for health checks and utilities
RUN apk add --no-cache curl dumb-init

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    API_PREFIX=/api/v1

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy backend node_modules from deps stage
COPY --from=backend-deps /app/backend/node_modules ./node_modules

# Copy backend source code
COPY backend/package.json ./
COPY backend/src ./src

# Create public directory for uploads and copy built frontend
RUN mkdir -p ./public/uploads ./public/static
COPY --from=frontend-builder /app/frontend/build ./public/static

# Create logs directory
RUN mkdir -p ./logs

# Set proper permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]

