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
  
  // Check the API response
  const apiResp = await page.request.get('http://localhost:3000/api/holidays');
  console.log('Holidays API status:', apiResp.status());
  const body = await apiResp.text();
  console.log('Holidays API response:', body);
  
  await browser.close();
})();
