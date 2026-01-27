

# ایجاد Workflow تست E2E با Playwright و تنظیمات Liara

## خلاصه
این برنامه شامل اضافه کردن تست‌های خودکار End-to-End با Playwright و همچنین تنظیم فایل `liara.json` برای deploy خودکار به Liara است.

---

## ۱. فایل‌های Playwright

### `.github/workflows/e2e.yml` - تست E2E
یک workflow جدید برای اجرای تست‌های E2E:

```text
┌─────────────────────────────────────────────────┐
│  Trigger: Push / Pull Request                   │
├─────────────────────────────────────────────────┤
│  1. Checkout کد                                 │
│  2. نصب Node.js 18                              │
│  3. نصب dependencies                            │
│  4. نصب Playwright browsers                    │
│  5. Build پروژه                                 │
│  6. اجرای تست‌های E2E                           │
│  7. آپلود گزارش تست (در صورت خطا)               │
└─────────────────────────────────────────────────┘
```

### `playwright.config.ts` - تنظیمات Playwright
تنظیمات شامل:
- اجرای وب سرور روی پورت 4173
- تست روی مرورگرهای Chrome, Firefox, Safari
- اسکرین‌شات و ویدیو در صورت خطا
- Retry برای flaky tests

### `e2e/` - پوشه تست‌ها

```text
e2e/
├── home.spec.ts       # تست صفحه اصلی
├── navigation.spec.ts # تست ناوبری
└── fixtures.ts        # داده‌های تست
```

---

## ۲. فایل `liara.json`

تنظیمات Liara بر اساس اطلاعات ارائه شده:

```json
{
  "app": "koshtyiran",
  "port": 80,
  "team-id": "687f2bfec24fa7e8e27436cb",
  "build": {
    "location": "iran"
  },
  "disks": []
}
```

---

## ۳. آپدیت workflow های موجود

### آپدیت `.github/workflows/deploy.yml`
اضافه کردن job جدید برای deploy خودکار به Liara:

```text
┌─────────────────────────────────────────────────┐
│  deploy-liara:                                  │
├─────────────────────────────────────────────────┤
│  1. نصب Liara CLI                               │
│  2. Login با API Token                          │
│  3. Deploy به Liara                             │
└─────────────────────────────────────────────────┘
```

---

## ۴. آپدیت `package.json`

اضافه کردن Playwright به devDependencies و اسکریپت‌های جدید:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.42.0"
  }
}
```

---

## لیست فایل‌های ایجادی/ویرایشی

| فایل | نوع | توضیح |
|------|-----|-------|
| `.github/workflows/e2e.yml` | ایجاد | workflow تست E2E |
| `playwright.config.ts` | ایجاد | تنظیمات Playwright |
| `e2e/home.spec.ts` | ایجاد | تست صفحه اصلی |
| `e2e/navigation.spec.ts` | ایجاد | تست ناوبری |
| `liara.json` | ایجاد | تنظیمات Liara |
| `.github/workflows/deploy.yml` | ویرایش | اضافه کردن deploy به Liara |
| `package.json` | ویرایش | اضافه کردن Playwright |
| `.gitignore` | ویرایش | اضافه کردن فولدرهای Playwright |

---

## بخش فنی

### GitHub Secrets مورد نیاز برای Liara

| Secret | توضیح |
|--------|-------|
| `LIARA_API_TOKEN` | توکن API از پنل Liara |

برای دریافت توکن:
1. ورود به پنل Liara
2. Settings → API Keys
3. ایجاد توکن جدید

### دستورات محلی Playwright

```bash
# نصب dependencies
npm install

# نصب مرورگرها
npx playwright install

# اجرای تست‌ها
npm run test:e2e

# اجرای تست با رابط گرافیکی
npm run test:e2e:ui

# مشاهده گزارش
npx playwright show-report
```

### دستور Deploy به Liara

```bash
# با Liara CLI
liara deploy --team-id 687f2bfec24fa7e8e27436cb

# یا از اسکریپت موجود
./scripts/deploy.sh
# سپس انتخاب گزینه 3 (Liara)
```

### ساختار نهایی

```text
project/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml (آپدیت شده)
│       └── e2e.yml (جدید)
├── e2e/
│   ├── home.spec.ts
│   └── navigation.spec.ts
├── liara.json (جدید)
├── playwright.config.ts (جدید)
└── package.json (آپدیت شده)
```

