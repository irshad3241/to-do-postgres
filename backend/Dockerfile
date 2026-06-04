# Use Node.js 20
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose application port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]

