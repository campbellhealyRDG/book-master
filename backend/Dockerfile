# Backend Dockerfile for Book Master API
# Optimised for Raspberry Pi 5 deployment

FROM node:18-alpine

# Install SQLite and other dependencies
RUN apk add --no-cache sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create data directory for database
RUN mkdir -p /app/data

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bookmaster -u 1001

# Change ownership of the app directory
RUN chown -R bookmaster:nodejs /app
RUN chmod -R 755 /app

USER bookmaster

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Initialize database and start the application
CMD ["sh", "-c", "npm run migrate && npm start"]