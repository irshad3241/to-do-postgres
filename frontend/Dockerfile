# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy package files first (separate layer)
COPY package*.json ./

# npm ci is faster than npm install for CI/CD
RUN npm ci --include=dev

# Copy source AFTER npm install (cache stays valid if no package changes)
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
