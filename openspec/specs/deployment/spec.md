# Deployment and Configuration Guide

## Deployment Overview
Self-hosted deployment solution supporting various environments with security, scalability, and maintainability as primary concerns.

## Supported Deployment Options

### Docker Deployment (Recommended)
Containerized deployment for easy setup and maintenance.

### Systemd Service
Native service deployment on Linux systems.

### Manual Installation
Direct installation with package managers.

## Docker Deployment

### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=/app/data/chat.db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./uploads:/var/www/uploads
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis-data:
```

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl sqlite

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations

# Create directories
RUN mkdir -p /app/data /app/uploads /app/logs
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Environment Configuration
```bash
# .env
# Database Configuration
DATABASE_URL=/app/data/chat.db

# Redis Configuration
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key
BCRYPT_ROUNDS=12

# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# File Storage
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Push Notifications (optional)
PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key
PUSH_VAPID_PRIVATE_KEY=your-vapid-private-key
PUSH_VAPID_EMAIL=admin@example.com

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    upstream backend {
        server app:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Authentication routes with stricter rate limiting
        location /api/v1/auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket routes
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File uploads
        location /uploads/ {
            alias /var/www/uploads/;
            add_header Cache-Control "public, max-age=31536000";
            
            # Security for file uploads
            location ~* \.(php|jsp|asp|sh|py)$ {
                deny all;
            }
        }

        # Frontend application
        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            access_log off;
        }
    }
}
```

## Systemd Service Deployment

### Service File
```ini
# /etc/systemd/system/chat-app.service
[Unit]
Description=Chat Application
After=network.target

[Service]
Type=simple
User=chatapp
Group=chatapp
WorkingDirectory=/opt/chat-app
Environment=NODE_ENV=production
EnvironmentFile=/opt/chat-app/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/chat-app/data /opt/chat-app/uploads /opt/chat-app/logs

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

### Installation Script
```bash
#!/bin/bash
# install.sh

set -e

# Configuration
APP_USER="chatapp"
APP_DIR="/opt/chat-app"
SERVICE_NAME="chat-app"

echo "Installing Chat Application..."

# Create user
if ! id "$APP_USER" &>/dev/null; then
    echo "Creating user: $APP_USER"
    useradd -r -s /bin/false -d "$APP_DIR" "$APP_USER"
fi

# Create directories
echo "Creating directories..."
mkdir -p "$APP_DIR"/{data,uploads,logs}
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Copy application files
echo "Copying application files..."
cp -r . "$APP_DIR/app"
chown -R "$APP_USER:$APP_USER" "$APP_DIR/app"

# Install dependencies
echo "Installing dependencies..."
cd "$APP_DIR/app"
sudo -u "$APP_USER" npm ci --only=production
npm run build

# Setup environment file
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Creating environment file..."
    cp .env.example "$APP_DIR/.env"
    echo "Please edit $APP_DIR/.env with your configuration"
fi

# Install systemd service
echo "Installing systemd service..."
cp chat-app.service "/etc/systemd/system/$SERVICE_NAME.service"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

# Setup nginx if needed
if command -v nginx &> /dev/null; then
    echo "Configuring nginx..."
    cp nginx.conf /etc/nginx/sites-available/chat-app
    ln -sf /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

echo "Installation complete!"
echo "Start the service with: systemctl start $SERVICE_NAME"
echo "Check status with: systemctl status $SERVICE_NAME"
```

## Manual Installation

### Prerequisites
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm sqlite3 nginx

# CentOS/RHEL
sudo yum install -y nodejs npm sqlite nginx

# macOS
brew install node sqlite nginx
```

### Application Setup
```bash
# Clone repository
git clone https://github.com/your-org/chat-app.git
cd chat-app

# Install dependencies
npm install

# Build frontend
npm run build

# Setup database
npm run db:migrate

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start application
npm run start:prod
```

## Database Setup and Migrations

### Migration Scripts
```javascript
// migrations/001_initial_schema.sql
-- User management
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email_hash TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    public_key TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline',
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add other tables as specified in database schema...
```

### Database Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups/chat-app"
DB_PATH="/opt/chat-app/data/chat.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/chat_backup_$DATE.db"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
sqlite3 "$DB_PATH" ".backup $BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Remove old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

## SSL/TLS Configuration

### Let's Encrypt Setup
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (added to crontab)
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Self-Signed Certificate (Development)
```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Monitoring and Logging

### Application Logging
```javascript
// logging.js
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE || 'logs/app.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

### Log Rotation Configuration
```bash
# /etc/logrotate.d/chat-app
/opt/chat-app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 chatapp chatapp
    postrotate
        systemctl reload chat-app
    endscript
}
```

### Health Check Endpoint
```javascript
// health.js
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
```

## Security Hardening

### Firewall Configuration
```bash
# UFW setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### AppArmor Profile
```bash
# /etc/apparmor.d/opt.chat-app
#include <tunables/global>

/opt/chat-app/app {
  #include <abstractions/base>
  #include <abstractions/nodejs>

  /opt/chat-app/app/ r,
  /opt/chat-app/app/** r,
  /opt/chat-app/data/** rw,
  /opt/chat-app/uploads/** rw,
  /opt/chat-app/logs/** w,

  deny /etc/passwd r,
  deny /etc/shadow r,
  deny /etc/hosts r,
}
```

### Security Headers Middleware
```javascript
// security.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Performance Optimization

### Database Optimization
```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation 
ON conversation_participants(user_id, conversation_id);

-- Pragma settings for performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000; -- 64MB cache
PRAGMA temp_store = MEMORY;
```

### Caching Configuration
```javascript
// cache.js
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

module.exports = redisClient;
```

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# automated_backup.sh

BACKUP_DIR="/opt/backups/chat-app"
APP_DIR="/opt/chat-app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="chat_backup_$DATE"
FULL_BACKUP_DIR="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory
mkdir -p "$FULL_BACKUP_DIR"

# Backup database
echo "Backing up database..."
sqlite3 "$APP_DIR/data/chat.db" ".backup $FULL_BACKUP_DIR/database.db"

# Backup uploads
echo "Backing up uploads..."
tar -czf "$FULL_BACKUP_DIR/uploads.tar.gz" -C "$APP_DIR" uploads/

# Backup configuration
echo "Backing up configuration..."
cp "$APP_DIR/.env" "$FULL_BACKUP_DIR/"
cp "$APP_DIR/package*.json" "$FULL_BACKUP_DIR/"

# Create backup manifest
cat > "$FULL_BACKUP_DIR/manifest.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "version": "$(cat $APP_DIR/package.json | jq -r .version)",
  "database_size": "$(stat -c%s $FULL_BACKUP_DIR/database.db)",
  "uploads_size": "$(stat -c%s $FULL_BACKUP_DIR/uploads.tar.gz)"
}
EOF

# Compress entire backup
echo "Compressing backup..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$FULL_BACKUP_DIR"

echo "Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
```

### Recovery Script
```bash
#!/bin/bash
# recover.sh

BACKUP_FILE="$1"
APP_DIR="/opt/chat-app"
TEMP_DIR="/tmp/chat_restore_$$"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

echo "Recovering from backup: $BACKUP_FILE"

# Extract backup
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Stop application
systemctl stop chat-app

# Restore database
echo "Restoring database..."
cp "$TEMP_DIR"/*/database.db "$APP_DIR/data/chat.db"

# Restore uploads
echo "Restoring uploads..."
rm -rf "$APP_DIR/uploads"
tar -xzf "$TEMP_DIR"/*/uploads.tar.gz -C "$APP_DIR"

# Restore configuration
echo "Restoring configuration..."
cp "$TEMP_DIR"/*/.env "$APP_DIR/"

# Start application
systemctl start chat-app

# Cleanup
rm -rf "$TEMP_DIR"

echo "Recovery completed"
```

## Troubleshooting

### Common Issues

#### Database Lock Issues
```bash
# Check for database locks
lsof /opt/chat-app/data/chat.db

# Clear locks if needed
systemctl stop chat-app
sqlite3 /opt/chat-app/data/chat.db "PRAGMA wal_checkpoint(TRUNCATE);"
systemctl start chat-app
```

#### Performance Issues
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Check database performance
sqlite3 /opt/chat-app/data/chat.db "EXPLAIN QUERY PLAN SELECT * FROM messages WHERE conversation_id = '123' ORDER BY created_at DESC LIMIT 50;"

# Check logs
tail -f /opt/chat-app/logs/app.log
```

#### SSL Certificate Issues
```bash
# Check certificate expiration
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout | grep "Not After"

# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Maintenance Tasks

### Daily Tasks
```bash
#!/bin/bash
# daily_maintenance.sh

# Clear old temp files
find /opt/chat-app/uploads/temp -mtime +1 -delete

# Clean up expired sessions
psql -d chatapp -c "DELETE FROM user_sessions WHERE expires_at < NOW();"

# Rotate logs
logrotate /etc/logrotate.d/chat-app
```

### Weekly Tasks
```bash
#!/bin/bash
# weekly_maintenance.sh

# Database optimization
sqlite3 /opt/chat-app/data/chat.db "VACUUM; ANALYZE;"

# Clean up old files
find /opt/chat-app/uploads -name "*.tmp" -mtime +7 -delete

# Update SSL certificates if needed
certbot renew --quiet
```

### Monthly Tasks
```bash
#!/bin/bash
# monthly_maintenance.sh

# Full database backup
/opt/chat-app/scripts/backup.sh

# Security updates
apt update && apt upgrade -y

# Review logs for security issues
grep -i "error\|warning\|attack" /opt/chat-app/logs/app.log | tail -100
```