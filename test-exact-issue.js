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
  await page.waitForTimeout(3000);
  
  // Find the exact main element
  const mainElement = page.locator('main').first();
  const mainHtml = await mainElement.innerHTML();
  console.log('Main element HTML:', mainHtml.substring(0, 1000));
  
  // Find the content area with the menu
  const contentArea = await page.locator('text=Thực Đơn Tuần này').locator('..').locator('..').locator('..').locator('main').innerHTML().catch(() => 'not found');
  console.log('\nContent area:', contentArea.substring(0, 500));
  
  // Get all text with more context
  const fullText = await page.locator('body').textContent();
  const menuIndex = fullText.indexOf('Món chính');
  console.log('\nAround Món chính:', fullText.substring(menuIndex - 50, menuIndex + 200));
  
  await browser.close();
})();
