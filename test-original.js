const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(4000);
  
  const bodyText = await page.locator('body').textContent();
  
  console.log('ORIGINAL CODE (before my changes):');
  console.log('  Has "Thịt kho tàu":', bodyText.includes('Thịt kho tàu'));
  console.log('  Has "Chả lá lốt":', bodyText.includes('Chả lá lốt'));
  console.log('  Has "Chưa có menu":', bodyText.includes('Chưa có menu'));
  
  await browser.close();
})();
