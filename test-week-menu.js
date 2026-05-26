const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Use 127.0.0.1 as per playwright config
  await page.goto('http://127.0.0.1:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  console.log('Logged in, URL:', page.url());
  
  // Capture API responses
  const responses = {};
  page.on('response', resp => {
    if (resp.url().includes('api/daily-menus') || resp.url().includes('api/registrations')) {
      responses[resp.url()] = { status: resp.status() };
    }
  });
  
  // Navigate to dashboard
  await page.goto('http://127.0.0.1:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Get the menu content
  const menuSection = await page.locator('text=Món chính').locator('..').locator('..').textContent().catch(() => 'not found');
  console.log('Menu section text:', menuSection?.substring(0, 300));
  
  // Check if the menu shows "Chưa có menu" or actual content
  const mainContent = await page.locator('body').textContent();
  const menuIndex = mainContent.indexOf('Món chính');
  console.log('\nAround Món chính:', mainContent.substring(menuIndex, menuIndex + 100));
  
  await browser.close();
})();
