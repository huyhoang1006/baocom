const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all responses
  page.on('response', resp => {
    console.log('Response:', resp.url(), resp.status());
  });
  
  // Login as admin
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"], input[placeholder="Tên đăng nhập"]', 'admin');
  await page.fill('input[name="password"], input[placeholder="Mật khẩu"]', 'admin123');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  console.log('Logged in, URL:', page.url());
  
  // Navigate to holidays page
  await page.goto('http://localhost:3000/admin/holidays');
  await page.waitForLoadState('networkidle');
  console.log('Holidays URL:', page.url());
  
  // Wait for any async operations
  await page.waitForTimeout(3000);
  
  // Get page content
  const content = await page.content();
  console.log('Page has loading:', content.includes('Đang tải'));
  console.log('Page has ngày lễ:', content.includes('ngày lễ'));
  console.log('Page has Chưa có ngày lễ:', content.includes('Chưa có ngày lễ'));
  
  // Check for specific elements
  const mainCount = await page.locator('main').count();
  console.log('Main element count:', mainCount);
  
  await browser.close();
})();
