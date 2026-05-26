const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForURL(/dashboard/, { timeout: 5000 });
  
  // Wait for dashboard to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Dashboard URL:', url);
  
  const bodyText = await page.locator('body').textContent();
  console.log('Has "Thực Đơn Tuần này":', bodyText.includes('Thực Đơn Tuần này'));
  console.log('Has "hungpx":', bodyText.includes('hungpx'));
  console.log('Has "Chưa có menu":', bodyText.includes('Chưa có menu'));
  
  // Check console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.waitForTimeout(2000);
  console.log('Console errors:', errors.length);
  
  await browser.close();
})();
