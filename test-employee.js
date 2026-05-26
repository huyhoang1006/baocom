const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all responses
  page.on('response', resp => {
    console.log('Response:', resp.url(), resp.status());
  });
  
  // Login as employee (hungpx from fixtures)
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"], input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[name="password"], input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  console.log('Logged in as employee, URL:', page.url());
  
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
  
  // Check for specific elements
  const mainCount = await page.locator('main').count();
  console.log('Main element count:', mainCount);
  
  if (mainCount > 0) {
    const mainText = await page.locator('main').textContent();
    console.log('Main text preview:', mainText?.substring(0, 300));
  }
  
  await browser.close();
})();
