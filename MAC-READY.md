# ✅ آماده برای نصب روی Mac!

## بله! الان می‌تونید نرم افزار رو روی Mac نصب کنید 🎉

همه چیز آماده است:
- ✅ Backend API کامل
- ✅ Desktop App با Electron
- ✅ رابط کاربری React
- ✅ Browser Core با Fingerprint Spoofing
- ✅ تنظیمات Build برای macOS

## 🚀 دو روش برای استفاده:

### روش 1: اجرای مستقیم (Development)

**مزایا:**
- نیازی به Build نیست
- تغییرات لحظه‌ای اعمال می‌شه
- برای توسعه و تست

**مراحل:**
```bash
# گام 1: راه‌اندازی Backend
cd backend
npm install
cp .env.example .env
# ویرایش .env برای MongoDB
npm run dev

# گام 2: راه‌اندازی Desktop (در ترمینال جدید)
cd desktop-app
npm install
cd renderer && npm install && cd ..
npm run dev
```

### روش 2: Build و نصب رسمی (Production)

**مزایا:**
- مثل یک برنامه واقعی Mac
- فایل .dmg مثل Spotify, Chrome و...
- قابل توزیع و نصب روی Mac‌های دیگه

**مراحل:**
```bash
# روش خیلی ساده!
./build-mac.sh
```

یا به صورت دستی:
```bash
cd desktop-app
npm run build:mac
```

**نتیجه:**
```
desktop-app/dist/
├── Anti-Detect Browser.dmg      ← فایل نصب DMG
└── Anti-Detect Browser.app.zip  ← فایل فشرده
```

## 📦 نصب فایل DMG

1. فایل `Anti-Detect Browser.dmg` رو باز کن
2. آیکون برنامه رو به پوشه Applications بکش
3. از Launchpad یا Finder اجرا کن

**اگر خطای امنیتی داد:**
```bash
xattr -cr "/Applications/Anti-Detect Browser.app"
```

## ⚙️ تنظیمات قبل از اجرا

### 1. MongoDB باید در حال اجرا باشه

**با Docker (ساده‌ترین):**
```bash
cd backend
docker-compose up -d
```

**یا نصب مستقیم:**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

### 2. Backend API

```bash
cd backend
npm install
cp .env.example .env

# ویرایش .env:
# - تنظیم MongoDB URL
# - تنظیم JWT secrets
# - تنظیم encryption keys

npm run dev
```

Backend روی `http://localhost:5000` در حال اجراست.

## 🎯 اولین استفاده

1. برنامه رو باز کن
2. با این اطلاعات تست کن یا ثبت‌نام کن:
   - Email: test@example.com
   - Password: Test123456

3. یک پروفایل جدید بساز
4. پروفایل رو اجرا کن
5. Fingerprint spoofing به صورت خودکار فعاله!

## 📋 چک لیست نهایی

قبل از Build:
- ✅ Node.js نصب شده؟ `node --version`
- ✅ MongoDB در حال اجراست? 
- ✅ Backend روی port 5000 در حال اجراست؟
- ✅ همه dependencies نصب شده؟

## 🛠️ مشکلات رایج

### برنامه باز نمیشه
```bash
# چک کردن لاگ‌ها
tail -f ~/Library/Logs/Anti-Detect\ Browser/main.log
```

### Backend متصل نمیشه
```bash
# تست کردن API
curl http://localhost:5000/api/health

# باید بگه: {"status":"ok"}
```

### خطای "Port 5000 in use"
```bash
# پیدا کردن و بستن process
lsof -i :5000
kill -9 <PID>
```

### خطای Build
```bash
# پاک کردن cache و دوباره تلاش
cd desktop-app
rm -rf node_modules dist
rm -rf renderer/node_modules renderer/dist
npm install
cd renderer && npm install && cd ..
npm run build:mac
```

## 📊 وضعیت پروژه

```
✅ Backend.................. 100%
✅ Authentication........... 100%
✅ Profile Management...... 100%
✅ Fingerprint Spoofing.... 100%
✅ Desktop App............. 100%
✅ React UI................ 100%
✅ Build Configuration..... 100%
✅ Documentation........... 100%

🎉 READY TO USE!
```

## 🎓 ویژگی‌های اصلی

### امنیت
- 🔐 AES-256-GCM Encryption
- 🔑 JWT Authentication
- 🛡️ Rate Limiting
- 📝 Audit Logging

### Anti-Detect
- 🎨 Canvas Fingerprinting
- 🎮 WebGL Spoofing
- 🔊 Audio Context
- 📡 WebRTC Protection
- 🌍 Geolocation Spoofing
- ⏰ Timezone Control

### مدیریت
- 👥 Multi-Profile
- 🔄 Profile Cloning
- 📤 Import/Export
- 🏷️ Tag System
- 🔗 Proxy Support

## 📞 پشتیبانی

**راهنماهای بیشتر:**
- `QUICK-START.md` - راهنمای سریع
- `INSTALL-MAC.md` - راهنمای نصب کامل
- `README.md` - مستندات کامل
- `SUMMARY.md` - خلاصه پروژه

**اجرا:**
```bash
# Development
npm run dev

# Build
./build-mac.sh
```

---

**نتیجه:** همه چیز آماده است! فقط یکی از دو روش بالا رو انتخاب کن و شروع کن! 🚀
