# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/components ./components
COPY --from=builder /app/contexts ./contexts
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/types ./types

# Install production dependencies only
RUN npm install --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"] 