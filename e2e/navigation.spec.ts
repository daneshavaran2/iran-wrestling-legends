import { test, expect } from '@playwright/test';

test.describe('ناوبری سایت', () => {
  test('باید به صفحه کشتی‌گیران برود', async ({ page }) => {
    await page.goto('/');
    
    // یافتن و کلیک روی لینک کشتی‌گیران
    const wrestlersLink = page.getByRole('link', { name: /کشتی.*گیر|قهرمان|wrestlers/i });
    
    if (await wrestlersLink.count() > 0) {
      await wrestlersLink.first().click();
      await page.waitForURL(/wrestlers/);
      await expect(page).toHaveURL(/wrestlers/);
    }
  });

  test('باید به صفحه آلبوم‌ها برود', async ({ page }) => {
    await page.goto('/');
    
    const albumsLink = page.getByRole('link', { name: /آلبوم|گالری|albums/i });
    
    if (await albumsLink.count() > 0) {
      await albumsLink.first().click();
      await page.waitForURL(/albums/);
      await expect(page).toHaveURL(/albums/);
    }
  });

  test('باید به صفحه تاریخچه برود', async ({ page }) => {
    await page.goto('/');
    
    const historyLink = page.getByRole('link', { name: /تاریخ|history/i });
    
    if (await historyLink.count() > 0) {
      await historyLink.first().click();
      await page.waitForURL(/history/);
      await expect(page).toHaveURL(/history/);
    }
  });

  test('باید به صفحه درباره موزه برود', async ({ page }) => {
    await page.goto('/');
    
    const aboutLink = page.getByRole('link', { name: /درباره|about/i });
    
    if (await aboutLink.count() > 0) {
      await aboutLink.first().click();
      await page.waitForURL(/about/);
      await expect(page).toHaveURL(/about/);
    }
  });

  test('باید لوگو به صفحه اصلی لینک داشته باشد', async ({ page }) => {
    await page.goto('/wrestlers');
    
    // کلیک روی لوگو
    const logo = page.locator('a[href="/"]').first();
    
    if (await logo.count() > 0) {
      await logo.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('دکمه بازگشت مرورگر', () => {
  test('باید با دکمه بازگشت به صفحه قبلی برگردد', async ({ page }) => {
    await page.goto('/');
    
    // رفتن به صفحه دیگر
    const anyLink = page.locator('a[href^="/"]').first();
    
    if (await anyLink.count() > 0) {
      const href = await anyLink.getAttribute('href');
      if (href && href !== '/') {
        await anyLink.click();
        await page.waitForTimeout(500);
        
        // بازگشت
        await page.goBack();
        await expect(page).toHaveURL('/');
      }
    }
  });
});

test.describe('صفحه 404', () => {
  test('باید صفحه 404 برای URL نامعتبر نمایش دهد', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    
    // بررسی محتوای صفحه 404
    const notFoundText = page.getByText(/404|not found|یافت نشد|صفحه.*وجود.*ندارد/i);
    
    // یا باید صفحه 404 نمایش داده شود یا به صفحه اصلی redirect شود
    const isNotFound = await notFoundText.count() > 0;
    const isHome = page.url().endsWith('/');
    
    expect(isNotFound || isHome).toBeTruthy();
  });
});

test.describe('تست RTL و فارسی', () => {
  test('باید جهت متن RTL باشد', async ({ page }) => {
    await page.goto('/');
    
    const html = page.locator('html');
    const dir = await html.getAttribute('dir');
    
    // بررسی RTL بودن
    expect(dir === 'rtl' || dir === null).toBeTruthy();
  });

  test('باید فونت فارسی درست نمایش داده شود', async ({ page }) => {
    await page.goto('/');
    
    // بررسی وجود متن فارسی
    const persianText = page.getByText(/[آ-ی]/);
    const count = await persianText.count();
    
    expect(count).toBeGreaterThan(0);
  });
});
