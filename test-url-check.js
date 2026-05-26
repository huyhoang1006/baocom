const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track URL changes
  let currentUrl = '';
  page.on('urlchange', url => {
    currentUrl = url;
    console.log('URL changed to:', url);
  });
  
  // Go to login
  await page.goto('http://localhost:3000/login');
  console.log('Initial URL:', page.url());
  
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  
  // Click login and wait for navigation
  await Promise.all([
    page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
    page.click('button:has-text("Đăng nhập")')
  ]);
  
  console.log('After click URL:', page.url());
  
  // Check if still on login
  const isLoginPage = await page.locator('text=Đăng nhập').count() > 0;
  console.log('Still on login page:', isLoginPage);
  
  // Wait a bit more
  await page.waitForTimeout(2000);
  console.log('Final URL:', page.url());
  
  const bodyText = await page.locator('body').textContent();
  console.log('Has dashboard content:', bodyText.includes('Thực Đơn'));
  
  await browser.close();
})();
