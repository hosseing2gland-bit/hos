#!/bin/bash

echo "🚀 شروع Build برای macOS..."
echo ""

# رنگ‌ها
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# چک کردن Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js نصب نیست!${NC}"
    echo "لطفاً Node.js را نصب کنید: brew install node"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# رفتن به پوشه desktop-app
cd desktop-app || exit

# نصب dependencies اگر نصب نشده
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 نصب dependencies...${NC}"
    npm install
fi

# نصب dependencies برای renderer
if [ ! -d "renderer/node_modules" ]; then
    echo -e "${BLUE}📦 نصب dependencies رابط کاربری...${NC}"
    cd renderer && npm install && cd ..
fi

# Build کردن React
echo -e "${BLUE}🔨 Build کردن رابط کاربری...${NC}"
cd renderer
npm run build
cd ..

# Build کردن Electron
echo -e "${BLUE}🔨 Build کردن Desktop App برای macOS...${NC}"
npm run build:mac

echo ""
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Build با موفقیت کامل شد!${NC}"
    echo ""
    echo "📦 فایل‌های نصب:"
    ls -lh dist/*.dmg dist/*.zip 2>/dev/null || true
    echo ""
    echo "📁 مسیر: $(pwd)/dist"
    echo ""
    echo -e "${GREEN}🎉 حالا می‌تونید فایل .dmg رو نصب کنید!${NC}"
else
    echo -e "${RED}❌ Build ناموفق بود. لطفاً خطاها را بررسی کنید.${NC}"
    exit 1
fi
