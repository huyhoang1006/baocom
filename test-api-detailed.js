const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all API responses
  const apiResponses = [];
  page.on('response', resp => {
    if (resp.url().includes('api')) {
      apiResponses.push({ url: resp.url(), status: resp.status() });
    }
  });
  
  // Login as employee
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('API responses:', JSON.stringify(apiResponses, null, 2));
  
  // Get API response content
  for (const resp of apiResponses) {
    if (resp.url.includes('daily-menus') || resp.url.includes('registrations')) {
      console.log(`\n${resp.url}:`);
      const response = await page.request.get(resp.url);
      const body = await response.text();
      console.log('Status:', resp.status);
      console.log('Body preview:', body.substring(0, 500));
    }
  }
  
  await browser.close();
})();
