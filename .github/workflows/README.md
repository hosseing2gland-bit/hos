# 🤖 GitHub Actions Workflows

این پوشه شامل تمام GitHub Actions workflows برای CI/CD پروژه است.

---

## 📋 لیست Workflows

### 1. 🔨 Build and Test (`build-and-test.yml`)

**هدف:** Build و Test خودکار پروژه برای همه پلتفرم‌ها

**Trigger:**
- Push به `main` یا `develop`
- Pull Request به `main` یا `develop`
- Manual (workflow_dispatch)

**Jobs:**
1. **test-backend** - تست Backend API با MongoDB
2. **build-windows** - Build Desktop App برای ویندوز
3. **build-macos** - Build Desktop App برای مک
4. **build-linux** - Build Desktop App برای لینوکس
5. **test-docker** - تست Docker Build
6. **security-scan** - بررسی آسیب‌پذیری‌های امنیتی
7. **build-summary** - خلاصه نتایج

**Artifacts:**
- Windows: `.exe` files
- macOS: `.dmg` + `.zip` files
- Linux: `.AppImage` + `.deb` files
- Backend: Test coverage

---

### 2. 🚀 Release (`release.yml`)

**هدف:** ایجاد Release و انتشار برای همه پلتفرم‌ها

**Trigger:**
- Push Tag با فرمت `v*.*.*` (مثال: `v1.0.0`)
- Manual با مشخص کردن نسخه

**Jobs:**
1. **create-release** - ایجاد GitHub Release
2. **build-windows** - Build و آپلود برای ویندوز
3. **build-macos** - Build و آپلود برای مک
4. **build-linux** - Build و آپلود برای لینوکس
5. **build-docker** - Build و Push Docker Image
6. **release-summary** - خلاصه Release

**نحوه استفاده:**
```bash
# ساخت tag جدید
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# یا از GitHub UI استفاده کنید
```

**خروجی:**
- GitHub Release با فایل‌های نصبی
- Docker Image در Docker Hub (اختیاری)

**توجه:** برای انتشار Docker Image، باید این Secrets رو تنظیم کنید:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

---

### 3. 🔧 Auto Fix (`auto-fix.yml`)

**هدف:** تحلیل و رفع خودکار خطاهای Build

**Trigger:**
- بعد از failure در Build and Test
- Manual (workflow_dispatch)

**Jobs:**
1. **analyze-and-fix** - تحلیل و رفع خطاها
2. **common-fixes** - اعمال fix های رایج
3. **diagnostic** - جمع‌آوری اطلاعات تشخیصی

**قابلیت‌ها:**
- ✅ تولید package-lock.json گمشده
- ✅ رفع خطاهای ESLint
- ✅ آپدیت dependency های آسیب‌پذیر
- ✅ ایجاد فایل‌های پیکربندی گمشده
- ✅ ایجاد PR خودکار با fix ها

**نحوه استفاده:**
1. اگه Build fail شد، این workflow خودکار اجرا می‌شه
2. یا از Actions tab به صورت دستی اجرا کنید
3. منتظر بمونید تا PR بسازه
4. PR رو Review و Merge کنید

---

### 4. 🔄 Backend CI (`backend-ci.yml`)

**هدف:** CI مخصوص Backend (از قبل موجود بود)

**Trigger:**
- Push به Backend files
- Pull Request

**Jobs:**
- Lint
- Test
- Build

---

### 5. 🏗️ Build (`build.yml`)

**هدف:** Build ساده (از قبل موجود بود)

**Trigger:**
- Push
- Pull Request

---

## 🔐 تنظیم GitHub Secrets

برای استفاده کامل از Workflows، این Secrets رو تنظیم کنید:

**مسیر:** Repository → Settings → Secrets and variables → Actions

| Secret | توضیحات | مورد نیاز |
|--------|---------|----------|
| `DOCKER_USERNAME` | نام کاربری Docker Hub | برای Release |
| `DOCKER_PASSWORD` | پسورد Docker Hub | برای Release |
| `GITHUB_TOKEN` | خودکار توسط GitHub تنظیم می‌شه | همیشه موجود |

---

## 🎯 نحوه استفاده

### Build خودکار

```bash
# فقط push کنید
git add .
git commit -m "feat: new feature"
git push origin main

# Workflow خودکار اجرا می‌شه
```

### ساخت Release

```bash
# Tag بزنید
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Release خودکار ساخته می‌شه
```

### رفع خودکار خطا

```bash
# اگه Build fail شد:
# 1. به Actions tab برید
# 2. "Auto Fix Errors" رو اجرا کنید (Run workflow)
# 3. منتظر PR بمونید
# 4. Review و Merge کنید
```

---

## 📊 مشاهده نتایج

### در GitHub:

1. **Actions tab** - مشاهده وضعیت Workflows
2. **Summary** - خلاصه نتایج هر Job
3. **Artifacts** - دانلود فایل‌های Build شده
4. **Releases** - دانلود نسخه‌های منتشر شده

### Badge ها:

می‌تونید badge های زیر رو به README.md اضافه کنید:

```markdown
![Build Status](https://github.com/USERNAME/REPO/workflows/Build%20and%20Test/badge.svg)
![Release](https://github.com/USERNAME/REPO/workflows/Release/badge.svg)
```

---

## 🐛 رفع مشکلات

### Build می‌افته:

1. **Log ها رو بررسی کنید:**
   - به Actions tab برید
   - روی failed job کلیک کنید
   - Log ها رو بخونید

2. **Auto-Fix رو اجرا کنید:**
   - Actions → Auto Fix Errors → Run workflow

3. **Manual Fix:**
   - مشکل رو locally رفع کنید
   - Push کنید

### Artifacts دانلود نمی‌شه:

- فقط برای 30 روز نگهداری می‌شه
- برای نگهداری بیشتر، از Release استفاده کنید

### Docker Push کار نمی‌کنه:

- Secrets رو چک کنید
- Docker Hub credentials رو تست کنید

---

## 📝 توسعه Workflows

### اضافه کردن Job جدید:

```yaml
new-job:
  name: My New Job
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Do something
      run: echo "Hello"
```

### استفاده از Secrets:

```yaml
- name: Use secret
  env:
    MY_SECRET: ${{ secrets.MY_SECRET }}
  run: echo "Secret is set"
```

### Conditional Jobs:

```yaml
build:
  if: github.event_name == 'push'
  # ...
```

---

## 🔍 بررسی Syntax

برای بررسی syntax قبل از push:

```bash
# نصب yamllint
pip install yamllint

# بررسی فایل‌ها
yamllint -d relaxed .github/workflows/*.yml
```

---

## 📚 منابع

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Action Marketplace](https://github.com/marketplace?type=actions)

---

**وضعیت:** ✅ همه Workflows تست شده و آماده استفاده هستند

**نسخه:** 1.0.0

**آخرین بروزرسانی:** نوامبر 2025
