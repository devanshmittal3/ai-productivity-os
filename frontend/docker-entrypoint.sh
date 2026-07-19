#!/bin/sh
set -eu

backend_host="${BACKEND_HOST:-backend}"
backend_port="${BACKEND_PORT:-8000}"
backend_scheme="${BACKEND_SCHEME:-http}"

cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass ${backend_scheme}://${backend_host}:${backend_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

exec nginx -g 'daemon off;'
