# 🪟 راهنمای نصب و اجرا روی Windows

این راهنما برای نصب و اجرای Anti-Detect Browser روی **Windows 10/11** است.

---

## 📋 پیش‌نیازها

قبل از شروع، این نرم‌افزارها رو نصب کنید:

### ✅ نرم‌افزارهای ضروری

1. **Node.js 18+ LTS**
   - دانلود از: https://nodejs.org/
   - نسخه LTS (Long Term Support) رو انتخاب کنید
   - در حین نصب، گزینه "Add to PATH" رو فعال کنید
   
   ```powershell
   # بعد از نصب، چک کنید:
   node --version
   npm --version
   ```

2. **Git for Windows**
   - دانلود از: https://git-scm.com/download/win
   - Git Bash رو هم نصب کنید (پیشنهادی)

3. **MongoDB Community Server 6+**
   - دانلود از: https://www.mongodb.com/try/download/community
   - نسخه Windows رو دانلود کنید
   - در حین نصب، گزینه "Install MongoDB as a Service" رو فعال کنید

### 🔧 ابزارهای Build (ضروری برای Desktop App)

```powershell
# باز کردن PowerShell یا CMD به عنوان Administrator
npm install -g windows-build-tools

# یا نصب Visual Studio Build Tools
# دانلود از: https://visualstudio.microsoft.com/downloads/
# و انتخاب "Desktop development with C++"
```

### 🐳 Docker Desktop (اختیاری - برای روش ساده‌تر)

- دانلود از: https://www.docker.com/products/docker-desktop
- نیاز به WSL2 داره (خودکار نصب می‌شه)

---

## 🚀 روش ۱: نصب با Docker (پیشنهادی - آسان‌ترین)

### مرحله ۱: آماده‌سازی

```powershell
# کلون کردن پروژه
git clone https://github.com/your-username/antidetect-browser.git
cd antidetect-browser

# کپی کردن فایل environment
copy .env.docker.example .env
```

### مرحله ۲: تنظیمات امنیتی

فایل `.env` رو با Notepad یا VS Code باز کنید و این مقادیر رو تغییر بدید:

```env
# کلیدهای امنیتی (حتماً تغییر بدید!)
MONGO_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-64-character-super-secret-jwt-key-change-immediately-make-it-random
ENCRYPTION_KEY=your-32-character-encryption-key
```

**نکته:** برای تولید کلیدهای امن:

```powershell
# در PowerShell:
$random = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
$bytes = New-Object byte[] 32
$random.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### مرحله ۳: اجرا

```powershell
# راه‌اندازی با Docker Compose
docker-compose up -d

# بررسی وضعیت
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs -f
```

✅ **تمام!** Backend در آدرس `http://localhost:3000` در دسترس است.

---

## 🔧 روش ۲: نصب Manual (بدون Docker)

### مرحله ۱: راه‌اندازی MongoDB

```powershell
# بعد از نصب MongoDB، سرویس رو شروع کنید:
net start MongoDB

# بررسی اتصال
mongosh
# اگه متصل شد، با Ctrl+C خارج بشید
```

### مرحله ۲: راه‌اندازی Backend

```powershell
# رفتن به پوشه backend
cd backend

# نصب dependencies
npm install

# کپی فایل environment
copy .env.example .env

# ویرایش .env با Notepad
notepad .env
```

**در فایل .env، حتماً اینها رو تغییر بدید:**

```env
# تولید JWT Secret (64 کاراکتر):
JWT_SECRET=نتیجه کد پایین رو اینجا بذارید

# تولید Encryption Key (دقیقاً 32 کاراکتر):
ENCRYPTION_KEY=نتیجه کد پایین رو اینجا بذارید (فقط 32 کاراکتر اول)

# تنظیم MongoDB
MONGODB_URI=mongodb://localhost:27017/antidetect_browser
```

**تولید کلیدها:**

```powershell
# در CMD یا PowerShell:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**اجرای Backend:**

```powershell
# Development mode (با auto-reload)
npm run dev

# یا Production mode
npm start
```

✅ Backend باید روی `http://localhost:3000` اجرا بشه.

### مرحله ۳: راه‌اندازی Desktop App

**در یک CMD/PowerShell جدید:**

```powershell
# رفتن به پوشه desktop-app
cd desktop-app

# نصب dependencies
npm install

# نصب dependencies رابط کاربری
cd renderer
npm install
cd ..

# اجرا در Development mode
npm run dev
```

✅ Desktop App باید باز بشه و به Backend متصل بشه.

---

## 📦 Build کردن Desktop App برای Windows

### روش آسان (با اسکریپت)

```powershell
# اجرای اسکریپت خودکار
.\build-windows.bat
```

### روش دستی

```powershell
cd desktop-app

# Build کردن React UI
cd renderer
npm run build
cd ..

# Build کردن Electron App
npm run build:win

# فایل‌های نصبی در پوشه dist ساخته می‌شن:
# - Anti-Detect Browser Setup.exe (نصاب)
# - Anti-Detect Browser.exe (نسخه Portable)
```

---

## 🎯 اجرای سریع (Quick Start)

### با اسکریپت آماده

```powershell
# اجرای Desktop App در Development mode
.\start.bat
```

یا با PowerShell:

```powershell
.\start.ps1
```

---

## ✅ تست کردن نصب

### ۱. تست Backend

```powershell
# در مرورگر یا با curl:
curl http://localhost:3000/api/v1/health

# یا در PowerShell:
Invoke-WebRequest -Uri http://localhost:3000/api/v1/health
```

باید جواب بده:

```json
{
  "success": true,
  "message": "API is healthy"
}
```

### ۲. ثبت‌نام کاربر اول

```powershell
# با PowerShell:
$body = @{
    username = "admin"
    email = "admin@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/v1/auth/register `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 🐛 رفع مشکلات متداول

### ❌ خطای "node" پیدا نشد

**راه‌حل:**

```powershell
# بستن و باز کردن مجدد CMD/PowerShell
# یا اضافه کردن Node به PATH:
# کنترل پنل > سیستم > تنظیمات پیشرفته > متغیرهای محیطی
# اضافه کردن: C:\Program Files\nodejs
```

### ❌ خطای "Cannot find module"

**راه‌حل:**

```powershell
# پاک کردن node_modules و نصب مجدد
Remove-Item -Recurse -Force node_modules
npm cache clean --force
npm install
```

### ❌ خطای "Python not found" در build

**راه‌حل:**

```powershell
# نصب Python 3.x
# دانلود از: https://www.python.org/downloads/
# یا با Chocolatey:
choco install python

# یا نصب windows-build-tools:
npm install -g windows-build-tools
```

### ❌ MongoDB اجرا نمی‌شه

**راه‌حل:**

```powershell
# شروع سرویس MongoDB
net start MongoDB

# اگه کار نکرد، اجرای دستی:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath C:\data\db

# ایجاد پوشه data اگه وجود نداره:
mkdir C:\data\db
```

### ❌ خطای "Port 3000 already in use"

**راه‌حل:**

```powershell
# پیدا کردن process که پورت رو استفاده می‌کنه:
netstat -ano | findstr :3000

# بستن process:
taskkill /PID <PID-NUMBER> /F

# یا تغییر پورت در .env:
PORT=3001
```

### ❌ خطای CORS در Desktop App

**راه‌حل:**

در فایل `backend/.env`:

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:5173
```

### ❌ Desktop App build نمی‌شه

**راه‌حل:**

```powershell
# نصب مجدد electron:
cd desktop-app
npm uninstall electron electron-builder
npm install electron@latest electron-builder@latest

# پاک کردن cache:
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 🔒 نکات امنیتی مهم

### ⚠️ قبل از استفاده در Production

1. **تغییر تمام کلیدهای امنیتی در .env:**
   - `JWT_SECRET` (حداقل 64 کاراکتر)
   - `ENCRYPTION_KEY` (دقیقاً 32 کاراکتر)
   - `MONGO_PASSWORD` (پسورد قوی)

2. **فعال‌سازی HTTPS:**
   - استفاده از SSL Certificate
   - پیکربندی Nginx یا IIS

3. **MongoDB Authentication:**
   ```powershell
   # اضافه کردن username/password به MongoDB
   mongosh
   use admin
   db.createUser({
     user: "admin",
     pwd: "SecurePassword123!",
     roles: ["root"]
   })
   ```

4. **فایروال:**
   ```powershell
   # فقط دسترسی local به MongoDB:
   # در mongod.cfg تنظیم کنید:
   # net:
   #   bindIp: 127.0.0.1
   ```

---

## 📊 مدیریت با PM2 (پیشنهادی برای Production)

### نصب PM2

```powershell
npm install -g pm2
pm2 install pm2-windows-service
pm2-service-install
```

### راه‌اندازی Backend با PM2

```powershell
cd backend

# شروع با PM2
pm2 start src/server.js --name antidetect-api

# ذخیره کردن لیست process
pm2 save

# راه‌اندازی خودکار با Windows
pm2 startup

# مشاهده وضعیت
pm2 status

# مشاهده لاگ‌ها
pm2 logs antidetect-api

# توقف
pm2 stop antidetect-api

# ریستارت
pm2 restart antidetect-api
```

---

## 📚 منابع بیشتر

- 📖 [مستندات کامل](README.md)
- 🚀 [راهنمای سریع](QUICK-START.md)
- 🏗️ [راهنمای Build](BUILD-GUIDE.md)
- 🔧 [رفع مشکلات](FIX-DAMAGED-ERROR.md)

---

## 💡 نکات مفید

### اجرای Backend و Frontend همزمان

```powershell
# در یک CMD:
cd backend && npm run dev

# در CMD دیگر:
cd desktop-app && npm run dev
```

### مشاهده لاگ‌های MongoDB

```powershell
# لاگ‌ها معمولاً در:
Get-Content "C:\Program Files\MongoDB\Server\6.0\log\mongod.log" -Tail 50 -Wait
```

### Backup از دیتابیس

```powershell
# Backup
mongodump --db antidetect_browser --out C:\backups\mongodb

# Restore
mongorestore --db antidetect_browser C:\backups\mongodb\antidetect_browser
```

---

## 🎉 شروع کار

حالا که همه چیز نصب شد:

1. ✅ Backend رو اجرا کنید: `npm start` در `backend/`
2. ✅ Desktop App رو اجرا کنید: `npm run dev` در `desktop-app/`
3. ✅ ثبت‌نام کنید و profile اول رو بسازید!

---

**موفق باشید! 🚀**

در صورت بروز مشکل، به [مستندات](README.md) مراجعه کنید یا Issue باز کنید.
