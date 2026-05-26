const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to login page
  await page.goto('http://localhost:3000/login');
  
  // Fill and submit login form
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  
  // Wait for navigation
  try {
    await page.waitForURL(/dashboard|admin/, { timeout: 5000 });
    console.log('After login URL:', page.url());
  } catch {
    console.log('Navigation did not complete, URL:', page.url());
  }
  
  await page.waitForLoadState('networkidle');
  
  // Check cookies
  const cookies = await context.cookies();
  console.log('Cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
  
  // Check for errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  
  await page.waitForTimeout(2000);
  
  if (consoleErrors.length > 0) {
    console.log('Console errors:', consoleErrors);
  }
  
  const bodyText = await page.locator('body').textContent();
  console.log('Page content preview:', bodyText.substring(0, 200));
  
  await browser.close();
})();
