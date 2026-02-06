# Use Node.js LTS (Debian-based) for better compatibility with build tools and Prisma
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Copy prisma directory BEFORE installing dependencies
# This is required because 'npm install' runs 'prisma generate' which needs the schema
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma Client (if needed for the frontend)
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
