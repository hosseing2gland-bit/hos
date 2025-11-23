# 🚀 راهنمای سریع برای شروع کار

## نصب سریع (Development Mode)

### گام 1: نصب Node.js
```bash
brew install node
```

### گام 2: راه‌اندازی Backend
```bash
cd backend
npm install
cp .env.example .env
# ویرایش .env و تنظیم MongoDB URL
npm run dev
```

### گام 3: راه‌اندازی Desktop App
```bash
# در ترمینال جدید
cd desktop-app
npm install
cd renderer && npm install && cd ..
npm run dev
```

✅ برنامه باز می‌شود!

## Build برای نصب روی Mac

```bash
cd desktop-app
npm run build:mac
```

فایل `.dmg` در پوشه `desktop-app/dist` ساخته می‌شود.

## مشکلات رایج

**خطای امنیتی macOS:**
```bash
xattr -cr "/Applications/Anti-Detect Browser.app"
```

**Backend وصل نمیشه:**
- چک کنید MongoDB در حال اجراست
- URL در `.env` رو چک کنید
- Backend روی `http://localhost:5000` در حال اجراست؟

**پورت در حال استفاده:**
```bash
lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9
```

## مراحل کامل Build

1. ✅ تمام صفحات UI ساخته شد
2. ✅ Backend API آماده است
3. ✅ Browser Core پیاده‌سازی شد
4. ⏳ فقط باید Build بگیرید!

```bash
# Build سریع
cd desktop-app
npm run build:mac

# نتیجه:
# desktop-app/dist/Anti-Detect Browser.dmg
```

## لیست تکمیل شده ✅

- [x] Backend API (Node.js + Express + MongoDB)
- [x] Authentication & JWT
- [x] Profile Management
- [x] Security Layer (Encryption, Rate Limiting)
- [x] Electron Main Process
- [x] Browser Core (Fingerprint Spoofing)
- [x] React UI (Login, Dashboard, Profiles, Settings)
- [x] Docker Configuration
- [x] Build Configuration
- [x] Documentation

**همه چیز آماده است! فقط Build بگیرید و نصب کنید! 🎉**
