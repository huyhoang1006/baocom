const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login as employee
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  
  // Check current week dates
  const today = new Date();
  console.log('Today (local):', today.toString());
  console.log('Today (UTC):', today.toUTCString());
  console.log('Today (Vietnam):', new Date(today.getTime() + 7*60*60*1000).toUTCString());
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Get all buttons text
  const buttons = await page.locator('button').allTextContents();
  console.log('\nAll buttons:', buttons);
  
  // Check for specific content
  const mainText = await page.locator('body').textContent();
  
  // Look for "T2" or "Thứ 2" patterns
  const hasT2 = mainText.includes('T2');
  const hasThu2 = mainText.includes('Thứ 2');
  console.log('\nHas T2:', hasT2, 'Has Thứ 2:', hasThu2);
  
  // Check what menu content shows
  const hasChuaCoMenu = mainText.includes('Chưa có menu');
  const hasMonChinh = mainText.includes('Món chính');
  console.log('Has Chưa có menu:', hasChuaCoMenu);
  console.log('Has Món chính:', hasMonChinh);
  
  await browser.close();
})();
