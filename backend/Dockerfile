# Use Node.js LTS (Debian-based) for better compatibility
FROM node:20

# Set working directory
WORKDIR /app

# Copy backend dependency files first (for caching)
COPY backend/package*.json ./backend/

# Copy prisma folder BEFORE install (important)
COPY backend/prisma ./backend/prisma

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Copy remaining project files
COPY backend ./backend

# Expose port
EXPOSE 8000

# Start server
CMD ["node", "server.js"]
