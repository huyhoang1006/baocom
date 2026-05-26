const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'admin');
  await page.fill('input[placeholder="Mật khẩu"]', 'admin123');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForURL(/admin\/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Navigate to holidays page
  await page.goto('http://localhost:3000/admin/holidays');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const bodyText = await page.locator('body').textContent();
  
  console.log('=== Holidays Page Test ===');
  console.log('Page URL:', page.url());
  console.log('Has "Ngày lễ":', bodyText.includes('Ngày lễ'));
  console.log('Has "Đang tải":', bodyText.includes('Đang tải'));
  console.log('Has "Chưa có ngày lễ":', bodyText.includes('Chưa có ngày lễ'));
  
  await browser.close();
})();
