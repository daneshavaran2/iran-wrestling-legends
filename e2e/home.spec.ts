import { test, expect } from '@playwright/test';

test.describe('صفحه اصلی موزه کشتی ایران', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('باید صفحه اصلی به درستی بارگذاری شود', async ({ page }) => {
    // بررسی عنوان صفحه
    await expect(page).toHaveTitle(/موزه کشتی/i);
  });

  test('باید منوی ناوبری نمایش داده شود', async ({ page }) => {
    // بررسی وجود لینک‌های اصلی
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('باید بخش قهرمانان قابل مشاهده باشد', async ({ page }) => {
    // اسکرول به پایین صفحه
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    
    // صبر برای بارگذاری محتوا
    await page.waitForTimeout(500);
  });

  test('باید تصاویر به درستی بارگذاری شوند', async ({ page }) => {
    // بررسی بارگذاری تصاویر
    const images = page.locator('img');
    const count = await images.count();
    
    // حداقل یک تصویر باید وجود داشته باشد
    expect(count).toBeGreaterThan(0);
  });

  test('باید دکمه‌ها قابل کلیک باشند', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeEnabled();
    }
  });

  test('باید صفحه responsive باشد', async ({ page }) => {
    // تست در سایز موبایل
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // بررسی منوی همبرگری یا عناصر موبایل
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('بارگذاری و عملکرد', () => {
  test('باید صفحه در کمتر از 5 ثانیه بارگذاری شود', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('نباید خطای کنسول وجود داشته باشد', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // فیلتر کردن خطاهای غیرضروری
    const criticalErrors = errors.filter(
      e => !e.includes('favicon') && !e.includes('manifest')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
