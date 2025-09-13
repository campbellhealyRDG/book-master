# Frontend Dockerfile for Book Master
# Optimised for Raspberry Pi 5 deployment

FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install serve to serve static files
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bookmaster -u 1001

# Change ownership of the app directory
RUN chown -R bookmaster:nodejs /app
USER bookmaster

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

# Start the application
CMD ["serve", "-s", "dist", "-l", "5173"]