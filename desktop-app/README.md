# Anti-Detect Browser Desktop Application

اپلیکیشن دسکتاپ مدیریت پروفایل مرورگر با Electron و React

## 🎯 ویژگی‌های کلیدی

### Electron Main Process
- مدیریت پنجره‌ها و lifecycle اپلیکیشن
- IPC Communication امن با renderer process
- ذخیره‌سازی محلی با electron-store
- Auto-updater برای به‌روزرسانی خودکار
- Logging کامل با electron-log

### Browser Core
- راه‌اندازی Chromium با Puppeteer
- پیاده‌سازی Fingerprint Spoofing پیشرفته
- مدیریت Proxy
- کنترل Cookies و LocalStorage
- مدیریت Extensions

### React UI
- رابط کاربری مدرن با Material-UI
- State management با Zustand
- Routing با React Router
- Toast notifications
- Responsive design

## 📦 نصب Dependencies

```bash
# Root dependencies
npm install

# Renderer dependencies
cd renderer
npm install
cd ..
```

## 🚀 اجرای Development

```bash
# اجرای همزمان React dev server و Electron
npm run dev

# یا به صورت جداگانه:
npm run dev:react   # فقط React
npm run dev:electron # فقط Electron (بعد از اجرای React)
```

## 🏗️ Build برای Production

### Build همه پلتفرم‌ها
```bash
npm run build
```

### Build پلتفرم‌های خاص
```bash
npm run build:mac    # macOS (DMG + ZIP)
npm run build:win    # Windows (NSIS + Portable)
npm run build:linux  # Linux (AppImage + DEB)
```

## 📁 ساختار پروژه

```
desktop-app/
├── main/                    # Electron main process
│   └── index.js            # Entry point و IPC handlers
├── preload/                 # Preload scripts
│   └── preload.js          # Context bridge API
├── browser-core/            # هسته مدیریت مرورگر
│   ├── launcher.js         # راه‌انداز Chromium
│   └── fingerprint.js      # Fingerprint spoofing
├── renderer/                # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   ├── utils/          # Utilities
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── build/                   # Build resources
│   ├── icon.icns           # macOS icon
│   ├── icon.ico            # Windows icon
│   └── icon.png            # Linux icon
└── package.json            # Main package.json
```

## 🔧 IPC API

### Store Operations
```javascript
// Get value
await window.electronAPI.store.get('key');

// Set value
await window.electronAPI.store.set('key', value);

// Delete key
await window.electronAPI.store.delete('key');

// Clear all
await window.electronAPI.store.clear();
```

### Profile Operations
```javascript
// Launch profile
await window.electronAPI.profile.launch(profile);

// Close profile
await window.electronAPI.profile.close(profileId);

// Export profile
await window.electronAPI.profile.export(profile);

// Import profile
await window.electronAPI.profile.import();
```

### Cookies Operations
```javascript
// Export cookies
await window.electronAPI.cookies.export(profileId);

// Import cookies
await window.electronAPI.cookies.import(profileId);
```

### File System
```javascript
// Select directory
await window.electronAPI.fs.selectDirectory();

// Select file
await window.electronAPI.fs.selectFile(options);
```

### App Info
```javascript
// Get version
await window.electronAPI.app.getVersion();

// Get platform
await window.electronAPI.app.getPlatform();

// Get path
await window.electronAPI.app.getPath('userData');
```

### Logging
```javascript
window.electronAPI.log.info('Info message');
window.electronAPI.log.error('Error message');
window.electronAPI.log.warn('Warning message');
```

## 🎨 UI Components

### Pages
- **Dashboard**: نمای کلی و آمار
- **Profiles**: لیست و مدیریت پروفایل‌ها
- **ProfileEditor**: ساخت/ویرایش پروفایل
- **Settings**: تنظیمات اپلیکیشن
- **Login**: صفحه ورود

### State Management (Zustand)
- **authStore**: مدیریت احراز هویت
- **profileStore**: مدیریت پروفایل‌ها
- **settingsStore**: تنظیمات کاربر

## 🔐 امنیت

### Context Isolation
- تمام preload scripts با context isolation
- هیچ دسترسی مستقیمی به Node.js از renderer
- API محدود و امن از طریق contextBridge

### Sandbox
- Renderer process در sandbox اجرا می‌شود
- دستررسی‌های محدود به سیستم عامل

### CSP (Content Security Policy)
- تنظیمات امنیتی سخت‌گیرانه
- جلوگیری از inline scripts
- محدودیت منابع external

## 🐛 عیب‌یابی

### مشکلات رایج

**مرورگر راه‌اندازی نمی‌شود:**
- بررسی کنید Chrome/Chromium نصب است
- مسیر Chromium را در تنظیمات بررسی کنید
- لاگ‌ها را در Developer Tools بررسی کنید

**خطای Connection:**
- مطمئن شوید Backend در حال اجراست
- آدرس API در تنظیمات را بررسی کنید
- فایروال/آنتی‌ویروس را بررسی کنید

**Build موفقیت‌آمیز نیست:**
- Cache را پاک کنید: `rm -rf node_modules dist`
- Dependencies را دوباره نصب کنید
- لاگ‌های electron-builder را بررسی کنید

### لاگ‌ها

**Development:**
- Console در DevTools
- Terminal output

**Production:**
- macOS: `~/Library/Logs/Anti-Detect Browser/`
- Windows: `%USERPROFILE%\AppData\Roaming\Anti-Detect Browser\logs\`
- Linux: `~/.config/Anti-Detect Browser/logs/`

## 📱 پلتفرم‌های پشتیبانی شده

- ✅ macOS 10.13+
- ✅ Windows 10+
- ✅ Linux (Ubuntu 18.04+, Fedora, Debian)

## 🔄 Auto Update

اپلیکیشن به صورت خودکار برای نسخه‌های جدید چک می‌کند و امکان به‌روزرسانی را فراهم می‌کند.

## 📄 License

Proprietary - All Rights Reserved
