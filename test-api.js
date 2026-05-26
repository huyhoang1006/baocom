const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all responses
  page.on('response', resp => {
    if (resp.url().includes('api')) {
      console.log('API Response:', resp.url(), resp.status());
    }
  });
  
  // Login as admin first
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"], input[placeholder="Tên đăng nhập"]', 'admin');
  await page.fill('input[name="password"], input[placeholder="Mật khẩu"]', 'admin123');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  console.log('Logged in, URL:', page.url());
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  console.log('Dashboard URL:', page.url());
  
  // Wait for any async operations
  await page.waitForTimeout(3000);
  
  // Get page content
  const content = await page.content();
  console.log('Page has loading:', content.includes('Đang tải'));
  console.log('Page has Thứ:', content.includes('Thứ'));
  console.log('Page has Chưa có:', content.includes('Chưa có'));
  
  await browser.close();
})();
