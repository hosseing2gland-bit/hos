# 🚀 Anti-Detect Browser - Enterprise Edition

یک نرم‌افزار پیشرفته مدیریت پروفایل مرورگر با قابلیت‌های Anti-Detection برای استفاده حرفه‌ای و تیمی

## 📋 فهرست مطالب

- [ویژگی‌ها](#-ویژگیها)
- [معماری](#-معماری)
- [نصب و راه‌اندازی](#-نصب-و-راهاندازی)
- [امنیت](#-امنیت)
- [استفاده](#-استفاده)
- [API Documentation](#-api-documentation)
- [Build و Deploy](#-build-و-deploy)
- [مشارکت](#-مشارکت)

## ✨ ویژگی‌ها

### 🔐 امنیت سطح Enterprise

- **رمزنگاری AES-256**: تمام داده‌های حساس با AES-256-GCM رمزنگاری می‌شوند
- **JWT Authentication**: سیستم احراز هویت مبتنی بر JWT با Refresh Token
- **Rate Limiting**: محافظت در برابر حملات Brute Force و DDoS
- **Input Validation**: اعتبارسنجی کامل ورودی‌ها با express-validator
- **Security Headers**: استفاده از Helmet.js برای تنظیم هدرهای امنیتی
- **NoSQL Injection Prevention**: جلوگیری از حملات Injection
- **Audit Logging**: ثبت تمام فعالیت‌های کاربران برای Audit

### 🎭 Fingerprint Spoofing پیشرفته

- **Canvas Fingerprinting**: تغییر Canvas با الگوریتم نویز هوشمند
- **WebGL Spoofing**: جعل vendor و renderer با نویز تصادفی
- **Audio Context**: تغییر Audio fingerprint
- **WebRTC Protection**: حفاظت کامل از نشت IP (3 حالت: real, fake, disabled)
- **Screen Properties**: تنظیم کامل اندازه، رزولوشن و pixel ratio
- **Navigator Properties**: جعل userAgent, platform, hardwareConcurrency و غیره
- **Timezone Spoofing**: تغییر timezone مرورگر
- **Geolocation**: تنظیم مختصات جغرافیایی دلخواه
- **Media Devices**: کنترل دستگاه‌های صوتی و تصویری
- **Font Spoofing**: کنترل فونت‌های قابل دسترس

### 🌐 مدیریت Proxy

- پشتیبانی از HTTP, HTTPS, SOCKS4, SOCKS5
- احراز هویت proxy با username/password
- تست خودکار اتصال proxy
- مدیریت چندین proxy به صورت همزمان

### ☁️ Cloud Sync (AWS S3)

- همگام‌سازی خودکار پروفایل‌ها با S3
- رمزنگاری End-to-End قبل از آپلود
- Version Control برای پروفایل‌ها
- Conflict Resolution هوشمند
- پشتیبان‌گیری خودکار

### 👥 Team Collaboration

- ایجاد و مدیریت تیم‌ها
- اشتراک‌گذاری پروفایل با اعضای تیم
- سطوح دسترسی مختلف (Owner, Admin, Member, Viewer)
- مدیریت دقیق مجوزها (Permissions)
- دعوت اعضا از طریق ایمیل
- Audit log برای فعالیت‌های تیمی

### 🔧 API Automation

- RESTful API کامل
- پشتیبانی از Puppeteer/Selenium
- API Key authentication
- Rate limiting مبتنی بر subscription
- Webhook support
- Swagger documentation

### 💼 Subscription Plans

- **Free**: 5 پروفایل، ویژگی‌های پایه
- **Basic**: 20 پروفایل، Cloud Sync
- **Pro**: 100 پروفایل، Team Collaboration، API
- **Enterprise**: Unlimited، تمام ویژگی‌ها، پشتیبانی اختصاصی

## 🏗️ معماری

### Backend (Node.js + Express + MongoDB)

```
backend/
├── src/
│   ├── config/          # تنظیمات و پیکربندی
│   │   ├── config.js
│   │   └── database.js
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── Profile.js
│   │   └── Team.js
│   ├── services/        # Business logic
│   │   ├── authService.js
│   │   ├── jwtService.js
│   │   └── ...
│   ├── controllers/     # Route handlers
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   └── ...
│   ├── middleware/      # Express middleware
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   ├── validation.js
│   │   ├── security.js
│   │   └── errorHandler.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   └── index.js
│   ├── utils/           # Utility functions
│   │   ├── logger.js
│   │   └── encryption.js
│   └── server.js        # Entry point
├── .env.example
└── package.json
```

### Desktop App (Electron + React)

```
desktop-app/
├── main/                # Electron main process
│   └── index.js
├── preload/             # Preload scripts
│   └── preload.js
├── browser-core/        # Browser management
│   ├── launcher.js
│   └── fingerprint.js
├── renderer/            # React UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
└── package.json
```

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

- **Node.js** 18+ LTS
- **MongoDB** 6+
- **Chrome/Chromium** (برای اجرای مرورگرها)
- **AWS Account** (اختیاری، برای Cloud Sync)

### نصب Backend

```bash
# ورود به پوشه backend
cd backend

# نصب dependencies
npm install

# کپی فایل .env
cp .env.example .env

# ویرایش فایل .env و تنظیم مقادیر
nano .env

# اجرای MongoDB (در ترمینال جداگانه)
mongod

# اجرای backend در حالت development
npm run dev

# یا برای production
npm start
```

### تنظیمات .env مهم

```env
# امنیتی (حتماً تغییر دهید!)
JWT_SECRET=your-super-secret-jwt-key-min-64-characters-change-this
ENCRYPTION_KEY=your-32-character-key-here-1234

# دیتابیس
MONGODB_URI=mongodb://localhost:27017/antidetect_browser

# AWS S3 (برای Cloud Sync)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=antidetect-profiles
```

### نصب Desktop App

```bash
# ورود به پوشه desktop-app
cd desktop-app

# نصب dependencies
npm install

# نصب dependencies رابط کاربری
cd renderer
npm install
cd ..

# اجرای در حالت development
npm run dev
```

## 🔒 امنیت

### رمزنگاری

- **AES-256-GCM** برای داده‌های حساس
- **bcrypt** با 12 rounds برای هش کردن رمزعبور
- **JWT** با HS256 برای توکن‌ها
- **End-to-End Encryption** برای Cloud Sync

### محافظت در برابر حملات

- ✅ SQL/NoSQL Injection Prevention
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Rate Limiting
- ✅ Brute Force Protection
- ✅ Parameter Pollution Prevention
- ✅ Security Headers (Helmet)

### Best Practices

- Session timeout بعد از 15 دقیقه
- قفل شدن اکانت بعد از 5 تلاش ناموفق
- Refresh token rotation
- IP whitelisting برای admin
- Audit logging تمام عملیات‌های حساس

## 📖 استفاده

### ایجاد کاربر جدید

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### ورود

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### ایجاد پروفایل

```bash
curl -X POST http://localhost:3000/api/v1/profiles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Profile",
    "fingerprint": {
      "userAgent": "Mozilla/5.0...",
      "platform": "Windows",
      "screen": {
        "width": 1920,
        "height": 1080
      }
    }
  }'
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - ثبت‌نام کاربر جدید
- `POST /api/v1/auth/login` - ورود کاربر
- `POST /api/v1/auth/refresh` - تمدید توکن
- `POST /api/v1/auth/logout` - خروج از حساب
- `GET /api/v1/auth/me` - دریافت اطلاعات کاربر
- `PUT /api/v1/auth/me` - ویرایش پروفایل کاربر
- `POST /api/v1/auth/change-password` - تغییر رمز عبور

### Profile Endpoints

- `GET /api/v1/profiles` - لیست پروفایل‌ها
- `GET /api/v1/profiles/:id` - دریافت یک پروفایل
- `POST /api/v1/profiles` - ایجاد پروفایل جدید
- `PUT /api/v1/profiles/:id` - ویرایش پروفایل
- `DELETE /api/v1/profiles/:id` - حذف پروفایل
- `POST /api/v1/profiles/:id/clone` - کپی پروفایل
- `POST /api/v1/profiles/:id/share` - اشتراک‌گذاری پروفایل
- `GET /api/v1/profiles/:id/export` - خروجی گرفتن از پروفایل
- `POST /api/v1/profiles/import` - وارد کردن پروفایل

## 🏗️ Build و Deploy

### Build Backend

```bash
cd backend

# Install production dependencies
npm ci --production

# Set environment to production
export NODE_ENV=production

# Run
npm start
```

### Build Desktop App

```bash
cd desktop-app

# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

فایل‌های build شده در `desktop-app/dist/` قرار می‌گیرند.

### Docker Deployment (Backend)

```bash
# Build Docker image
docker build -t antidetect-backend .

# Run container
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://mongo:27017/antidetect \
  -e JWT_SECRET=your-secret \
  --name antidetect-api \
  antidetect-backend
```

## 🔍 Testing

```bash
# Backend tests
cd backend
npm test

# Desktop app tests
cd desktop-app
npm test
```

## 📈 Monitoring

- **Winston** برای logging
- **Morgan** برای HTTP request logging
- **Prometheus** metrics (optional)
- **Health check endpoint**: `GET /api/v1/health`

## 🤝 مشارکت

این پروژه private است و برای استفاده تجاری طراحی شده است.

## 📝 License

Proprietary - All Rights Reserved

## 🆘 پشتیبانی

برای مشکلات فنی یا سوالات، لطفاً با تیم پشتیبانی تماس بگیرید.

---

**⚠️ هشدار**: این نرم‌افزار صرفاً برای استفاده قانونی و اخلاقی طراحی شده است. استفاده از آن برای فعالیت‌های غیرقانونی ممنوع و مسئولیت آن بر عهده کاربر است.

**🔒 امنیت**: هرگز اطلاعات حساس (کلیدها، توکن‌ها) را در کد commit نکنید. همیشه از متغیرهای محیطی استفاده کنید.

**✅ تست شده**: این نرم‌افزار به صورت کامل تست شده و برای استفاده Enterprise آماده است.
