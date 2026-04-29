# ذخیره کد بک‌اند در GitHub

## وضعیت فعلی

تمام کد بک‌اند پروژه از قبل داخل ریپازیتوری Lovable موجود است و در پوشه `supabase/` قرار دارد:

```text
supabase/
├── config.toml                    # تنظیمات پروژه بک‌اند
├── migrations/                    # تمام migrationهای دیتابیس (SQL)
└── functions/
    ├── generate-thumbnail/        # Edge Function تولید تصویر بندانگشتی
    ├── museum-assistant/          # Edge Function دستیار هوش مصنوعی موزه
    └── translate-content/         # Edge Function ترجمه محتوا با Gemini
```

علاوه بر این، کد سمت کلاینت که با بک‌اند ارتباط دارد نیز در پروژه موجود است:
- `src/integrations/supabase/client.ts` (auto-generated)
- `src/integrations/supabase/types.ts` (auto-generated، اسکیمای دیتابیس)
- `src/lib/supabase.ts` (wrapper سفارشی با fallback)

## راهکار: اتصال پروژه به GitHub

Lovable یک **همگام‌سازی دوطرفه (bidirectional sync)** با GitHub دارد. به محض اتصال، تمام کد پروژه شامل پوشهٔ `supabase/` به‌صورت خودکار و real-time روی GitHub push می‌شود. نیازی به هیچ کار اضافی برای بک‌اند نیست.

### مراحل اتصال (یک‌بار انجام می‌شود)

1. در ادیتور Lovable روی **Connectors** (در سایدبار) کلیک کنید
2. **GitHub → Connect project** را انتخاب کنید
3. اپلیکیشن GitHub Lovable را Authorize کنید
4. حساب یا سازمان GitHub موردنظر را انتخاب کنید
5. روی **Create Repository** کلیک کنید تا یک ریپازیتوری جدید با کل کد پروژه (شامل `supabase/`) ساخته شود

### بعد از اتصال

- هر تغییری در Lovable → خودکار به GitHub push می‌شود
- هر push روی GitHub → خودکار به Lovable sync می‌شود
- می‌توانید لوکال هم clone کنید، تغییر دهید و push کنید

## نکات مهم درباره بک‌اند

### چه چیزهایی در GitHub ذخیره می‌شود
- ✅ کد Edge Functionها (`supabase/functions/`)
- ✅ Migrationهای دیتابیس (`supabase/migrations/`)
- ✅ فایل تنظیمات `supabase/config.toml`
- ✅ تایپ‌های دیتابیس (`src/integrations/supabase/types.ts`)

### چه چیزهایی ذخیره **نمی‌شود** (و نباید بشوند)
- ❌ **دادهٔ واقعی دیتابیس** (محتوای جداول): این داده روی Lovable Cloud زندگی می‌کند. برای backup گرفتن باید از قسمت Cloud → Database → Tables به‌صورت CSV export کنید.
- ❌ **Secrets و API Keys**: مقادیر secret در Lovable Cloud نگهداری می‌شوند، نه در `.env` ریپازیتوری.
- ❌ فایل `.env` (auto-generated و gitignore شده)

## آیا کار خاصی در کد لازم است؟

**خیر.** بعد از اینکه شما در پنل Lovable روی Connectors → GitHub → Connect project کلیک کنید، همه چیز خودکار انجام می‌شود. نیازی به تغییر در کد نیست.

اگر می‌خواهید بعد از اتصال، **بکاپ دادهٔ دیتابیس** را هم به‌صورت دوره‌ای در ریپو ذخیره کنید (مثلاً برای Excel/JSON export که از قبل در ادمین موجود است)، می‌توانم یک GitHub Action بنویسم که این export را زمان‌بندی‌شده انجام دهد و در ریپو commit کند. لطفاً اگر این را می‌خواهید بفرمایید.
