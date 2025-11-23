# 🚀 Anti-Detect Browser - Enterprise Edition

نرم‌افزار مدیریت پروفایل مرورگر با قابلیت Anti-Detection سطح Enterprise - با امنیت و کیفیت بالا برای استفاده تجاری

[![Build Status](https://img.shields.io/github/workflow/status/owner/repo/build)](https://github.com/owner/repo/actions)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

## ✨ ویژگی‌های کلیدی

### 🔐 امنیت سطح Enterprise
- ✅ **AES-256 Encryption** - رمزنگاری تمام داده‌های حساس
- ✅ **JWT Authentication** - سیستم احراز هویت امن با Refresh Token
- ✅ **Rate Limiting** - محافظت در برابر Brute Force
- ✅ **Input Validation** - اعتبارسنجی کامل ورودی‌ها
- ✅ **Security Headers** - Helmet.js برای امنیت HTTP
- ✅ **Audit Logging** - ثبت تمام فعالیت‌های کاربران

### 🎭 Fingerprint Spoofing پیشرفته
- ✅ **Canvas Fingerprinting** - تغییر Canvas با الگوریتم نویز
- ✅ **WebGL Spoofing** - جعل vendor و renderer
- ✅ **Audio Context** - تغییر Audio fingerprint
- ✅ **WebRTC Protection** - 3 حالت محافظت از IP
- ✅ **Screen Properties** - کنترل کامل رزولوشن و pixel ratio
- ✅ **Navigator Override** - جعل تمام خصوصیات navigator
- ✅ **Timezone Spoofing** - تغییر timezone
- ✅ **Geolocation** - تنظیم موقعیت جغرافیایی
- ✅ **Media Devices** - کنترل دستگاه‌های صوتی/تصویری

### 🌐 مدیریت حرفه‌ای
- ✅ **Proxy Support** - HTTP, HTTPS, SOCKS4, SOCKS5
- ✅ **Cloud Sync** - همگام‌سازی با AWS S3 (رمزنگاری شده)
- ✅ **Team Collaboration** - مدیریت تیم و سطوح دسترسی
- ✅ **API Automation** - RESTful API کامل
- ✅ **Multi-Platform** - Windows, macOS, Linux

## 📋 پیش‌نیازها

### Backend
- **Node.js** 18+ LTS
- **MongoDB** 6+
- **AWS S3** (اختیاری، برای Cloud Sync)

### Desktop App
- **Node.js** 18+ LTS
- **Chrome/Chromium** (برای اجرای مرورگر)

## 🚀 نصب سریع

### روش 1: Docker (پیشنهادی برای Production)

```bash
# کپی فایل environment
cp .env.docker.example .env

# ویرایش .env و تنظیم مقادیر امنیتی
nano .env

# اجرای با Docker Compose
docker-compose up -d

# بررسی وضعیت
docker-compose ps
```

Backend در آدرس `http://localhost:3000` در دسترس است.

### روش 2: نصب Manual

#### Backend

```bash
cd backend
npm install
cp .env.example .env
nano .env  # تنظیم JWT_SECRET, ENCRYPTION_KEY, MONGODB_URI

# اجرای MongoDB
mongod

# اجرا در development
npm run dev

# یا production
npm start
```

#### Desktop App

```bash
cd desktop-app
npm install

cd renderer
npm install
cd ..

# Development
npm run dev

# Build
npm run build        # همه پلتفرم‌ها
npm run build:mac    # فقط macOS
npm run build:win    # فقط Windows
npm run build:linux  # فقط Linux
```

## 📁 ساختار پروژه

```
antidetect-browser/
├── backend/                      # Node.js API Server
│   ├── src/
│   │   ├── config/              # تنظیمات و پیکربندی
│   │   │   ├── config.js        # Configuration management
│   │   │   └── database.js      # MongoDB connection
│   │   ├── models/              # Mongoose models
│   │   │   ├── User.js          # User model با امنیت بالا
│   │   │   ├── Profile.js       # Profile model
│   │   │   ├── Team.js          # Team collaboration
│   │   │   └── index.js
│   │   ├── services/            # Business logic
│   │   │   ├── authService.js   # Authentication logic
│   │   │   └── jwtService.js    # JWT management
│   │   ├── controllers/         # Route handlers
│   │   │   ├── authController.js
│   │   │   └── profileController.js
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.js          # Authentication & Authorization
│   │   │   ├── rateLimiter.js   # Rate limiting
│   │   │   ├── validation.js    # Input validation
│   │   │   ├── security.js      # Security headers
│   │   │   └── errorHandler.js  # Error handling
│   │   ├── routes/              # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── profileRoutes.js
│   │   │   └── index.js
│   │   ├── utils/               # Utilities
│   │   │   ├── logger.js        # Winston logger
│   │   │   └── encryption.js    # AES-256 encryption
│   │   └── server.js            # Entry point
│   ├── Dockerfile               # Docker configuration
│   ├── .env.example            # Environment template
│   ├── package.json
│   └── README.md
│
├── desktop-app/                 # Electron Desktop App
│   ├── main/                    # Main process
│   │   └── index.js            # Electron main & IPC
│   ├── preload/                 # Preload scripts
│   │   └── preload.js          # Context bridge API
│   ├── browser-core/            # Browser management
│   │   ├── launcher.js         # Chromium launcher
│   │   └── fingerprint.js      # Fingerprint spoofing
│   ├── renderer/                # React UI
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── utils/          # Utilities
│   │   │   └── App.jsx
│   │   ├── vite.config.js
│   │   └── package.json
│   ├── build/                   # Build resources (icons)
│   ├── package.json
│   └── README.md
│
├── .github/                     # GitHub workflows
│   └── workflows/
│       ├── build.yml           # Build & Release
│       └── backend-ci.yml      # Backend CI/CD
│
├── docker-compose.yml          # Docker orchestration
├── .env.docker.example        # Docker env template
└── README.md                  # این فایل
```

## 🔧 تنظیمات مهم

### Backend (.env)

```env
# امنیتی (REQUIRED - حتماً تغییر دهید!)
JWT_SECRET=your-64-character-super-secret-jwt-key-change-immediately
ENCRYPTION_KEY=your-32-character-encryption-key  # باید دقیقاً 32 کاراکتر باشد

# دیتابیس
MONGODB_URI=mongodb://localhost:27017/antidetect_browser

# سرور
PORT=3000
NODE_ENV=production

# AWS S3 (اختیاری - برای Cloud Sync)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=antidetect-profiles
AWS_REGION=us-east-1

# امنیت
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:5173
```

### ⚠️ نکات امنیتی مهم

1. **JWT_SECRET**: حداقل 64 کاراکتر، تصادفی و پیچیده
2. **ENCRYPTION_KEY**: دقیقاً 32 کاراکتر برای AES-256
3. **MONGODB_URI**: در production از authentication استفاده کنید
4. **AWS Keys**: هرگز در git commit نکنید
5. **.env**: به .gitignore اضافه شده است

### تولید کلیدهای امن

```bash
# JWT Secret (64 کاراکتر)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (32 کاراکتر)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

#### Refresh Token
```bash
POST /api/v1/auth/refresh
Cookie: refreshToken=...

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

### Profile Endpoints

#### Get All Profiles
```bash
GET /api/v1/profiles
Authorization: Bearer YOUR_ACCESS_TOKEN

Query Parameters:
- status: active|inactive|archived
- limit: 1-100 (default: 100)
- skip: 0+ (default: 0)
- search: search term
```

#### Create Profile
```bash
POST /api/v1/profiles
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "My Profile",
  "fingerprint": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "platform": "Windows",
    "screen": {
      "width": 1920,
      "height": 1080,
      "colorDepth": 24,
      "pixelRatio": 1
    },
    "webgl": {
      "vendor": "Google Inc.",
      "renderer": "ANGLE (Intel)",
      "noise": true
    },
    "canvas": {
      "noise": true
    }
  },
  "proxy": {
    "enabled": true,
    "type": "socks5",
    "host": "proxy.example.com",
    "port": 1080,
    "username": "user",
    "password": "pass"
  }
}
```

#### Update Profile
```bash
PUT /api/v1/profiles/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

#### Delete Profile
```bash
DELETE /api/v1/profiles/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Clone Profile
```bash
POST /api/v1/profiles/:id/clone
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Cloned Profile Name"
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

### Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Password Reset**: 3 requests per hour

Headers returned:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## 🔒 امنیت

### رمزنگاری

| Component | Algorithm | Description |
|-----------|-----------|-------------|
| **Passwords** | bcrypt | 12 rounds salt |
| **Data Encryption** | AES-256-GCM | For sensitive data |
| **JWT Tokens** | HS256 | Access & refresh tokens |
| **Cloud Storage** | AES-256-GCM | End-to-end encryption before upload |

### محافظت‌های امنیتی

✅ **Authentication & Authorization**
- JWT-based authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Account lockout after 5 failed attempts

✅ **Input Validation**
- express-validator for all inputs
- Type checking
- Length limits
- Pattern matching

✅ **Injection Prevention**
- NoSQL injection protection (express-mongo-sanitize)
- XSS prevention
- Parameter pollution prevention
- SQL injection (N/A - using MongoDB)

✅ **Rate Limiting**
- Global API rate limiting
- Endpoint-specific limits
- IP-based tracking
- Subscription-based limits

✅ **Security Headers**
- Helmet.js configuration
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

✅ **Data Protection**
- HTTPS enforcement (production)
- Secure cookie flags
- httpOnly cookies for tokens
- sameSite cookie policy

✅ **Audit Logging**
- All user actions logged
- IP address tracking
- Timestamp for all operations
- Retention policy (last 100 entries)

### Security Best Practices

1. **Secrets Management**
   ```bash
   # Never commit .env files
   # Use environment variables
   # Rotate secrets regularly
   # Use different secrets for dev/prod
   ```

2. **Database Security**
   ```javascript
   // Always use authentication
   mongodb://username:password@host:port/database
   
   // Enable access control
   // Limit network exposure
   // Regular backups
   ```

3. **HTTPS/TLS**
   ```nginx
   # Always use HTTPS in production
   # Configure strong ciphers
   # Enable HSTS
   # Regular certificate renewal
   ```

4. **Monitoring**
   - Monitor failed login attempts
   - Track unusual API usage
   - Set up alerts for security events
   - Regular security audits

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix lint errors
npm run lint:fix
```

### Test Structure

```
backend/tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── models/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    └── scenarios/
```

### Environment Variables for Testing

```env
NODE_ENV=test
MONGODB_TEST_URI=mongodb://localhost:27017/antidetect_test
JWT_SECRET=test-secret-key
ENCRYPTION_KEY=test-encryption-key-32-chars-
```

## 🚢 Deployment

### Production Checklist

- [ ] تنظیم متغیرهای محیطی امن
- [ ] فعال‌سازی HTTPS
- [ ] پیکربندی MongoDB با authentication
- [ ] تنظیم AWS S3 bucket permissions
- [ ] فعال‌سازی monitoring و logging
- [ ] تنظیم backup خودکار
- [ ] بررسی security headers
- [ ] تست load testing
- [ ] فعال‌سازی rate limiting
- [ ] مستندسازی API

### Docker Deployment

```bash
# Production deployment با Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Update services
docker-compose pull
docker-compose up -d
```

### Manual Deployment

```bash
# Backend
cd backend
npm ci --production
NODE_ENV=production npm start

# با PM2 (Process Manager)
npm install -g pm2
pm2 start src/server.js --name antidetect-api
pm2 save
pm2 startup
```

### Nginx Configuration (Optional)

```nginx
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📊 Monitoring

### Health Check

```bash
# API Health
curl http://localhost:3000/api/v1/health

Response:
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Metrics (Optional)

```bash
# با Prometheus
curl http://localhost:9090/metrics
```

### Logs

```bash
# Development
tail -f backend/logs/combined.log

# Production (Docker)
docker logs -f antidetect-backend

# با PM2
pm2 logs antidetect-api
```

## 🤝 مشارکت

این پروژه private و برای استفاده تجاری است.

## 📄 License

**Proprietary License** - All Rights Reserved

این نرم‌افزار دارای مجوز اختصاصی (Proprietary) است و تمام حقوق محفوظ می‌باشد.

## 📞 پشتیبانی

برای سوالات فنی، مشکلات یا پشتیبانی:

- 📧 Email: support@antidetect.com
- 📱 Telegram: @antidetect_support
- 🌐 Website: https://antidetect.com

## ⚠️ هشدارها و یادآوری‌ها

### استفاده قانونی

این نرم‌افزار **صرفاً برای استفاده قانونی و اخلاقی** طراحی شده است:
- ✅ تست و توسعه وب
- ✅ مدیریت چندین اکانت تجاری
- ✅ حفاظت از حریم خصوصی
- ❌ فعالیت‌های غیرقانونی
- ❌ کلاهبرداری یا تقلب
- ❌ نقض قوانین و مقررات

### امنیت

- 🔐 **هرگز secrets را در git commit نکنید**
- 🔑 **کلیدها و توکن‌ها را منظم تغییر دهید**
- 🛡️ **همیشه از HTTPS در production استفاده کنید**
- 🔒 **MongoDB را با authentication راه‌اندازی کنید**
- 📝 **لاگ‌ها را منظم بررسی کنید**

### Performance

- ⚡ برای production از **caching** استفاده کنید
- 📊 **Database indexing** را فعال کنید
- 🔄 **Connection pooling** را پیکربندی کنید
- 📈 منابع سرور را **monitor** کنید

## 🎯 Roadmap

- [ ] پشتیبانی از Firefox
- [ ] Mobile app (iOS/Android)
- [ ] Browser Extensions support
- [ ] Advanced analytics dashboard
- [ ] Webhook notifications
- [ ] Multi-language support
- [ ] CLI tool
- [ ] Kubernetes deployment

---

**Developed with ❤️ for Enterprise Users**

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** ✅ Production Ready
