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
  await page.waitForTimeout(4000);
  
  const bodyText = await page.locator('body').textContent();
  
  console.log('=== Holidays Page Final Test ===');
  console.log('Page URL:', page.url());
  console.log('Has "Ngày lễ / Ngày nghỉ":', bodyText.includes('Ngày lễ / Ngày nghỉ'));
  console.log('Has "Đang tải...":', bodyText.includes('Đang tải...'));
  console.log('Has "Chưa có ngày lễ nào":', bodyText.includes('Chưa có ngày lễ nào'));
  console.log('Has "Thêm ngày lễ":', bodyText.includes('Thêm ngày lễ'));
  
  // Check if page actually loaded (not stuck in loading state)
  const isStuck = !bodyText.includes('Ngày lễ / Ngày nghỉ') && bodyText.includes('Đang tải');
  console.log('Is stuck in loading:', isStuck ? 'YES (BUG!)' : 'NO (working correctly)');
  
  await browser.close();
})();
