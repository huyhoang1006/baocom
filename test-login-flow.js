const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login and wait for redirect
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  
  // Wait for navigation to complete
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  console.log('After login URL:', page.url());
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const bodyText = await page.locator('body').textContent();
  console.log('Has "Thực Đơn Tuần này":', bodyText.includes('Thực Đơn Tuần này'));
  console.log('Has "hungpx":', bodyText.includes('hungpx'));
  console.log('Has "Chưa có menu":', bodyText.includes('Chưa có menu'));
  
  await browser.close();
})();
