FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

# Create nginx config
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name localhost;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '' \
  '  gzip on;' \
  '  gzip_vary on;' \
  '  gzip_min_length 1024;' \
  '  gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;' \
  '' \
  '  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {' \
  '    expires 1y;' \
  '    add_header Cache-Control "public, immutable";' \
  '  }' \
  '' \
  '  location / {' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '' \
  '  location /health {' \
  '    access_log off;' \
  '    return 200 "healthy\n";' \
  '    add_header Content-Type text/plain;' \
  '  }' \
  '}' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]