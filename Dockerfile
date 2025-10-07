# Build Stage - Memory optimized
FROM node:lts-alpine as build-stage
WORKDIR /app

# Set memory limits for Node.js
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies with memory optimization
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY . .

# Build with memory optimization
RUN npm run build

# Production stage - Ultra minimal nginx
FROM nginx:alpine

# Remove unnecessary nginx modules and files to reduce memory footprint
RUN rm -rf /usr/share/nginx/html/* && \
    rm -rf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy optimized nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set nginx memory limits
ENV NGINX_WORKER_PROCESSES=1
ENV NGINX_WORKER_CONNECTIONS=1024

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

# Run nginx as root (required for port binding)
CMD ["nginx", "-g", "daemon off;"]
