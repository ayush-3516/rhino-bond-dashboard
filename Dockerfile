# Build Stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY . .
RUN npm run build

# Production stage (uses nginx)
FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]
