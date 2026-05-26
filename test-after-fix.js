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
  
  // Wait for React to re-render after HMR (Hot Module Replacement)
  await page.waitForTimeout(3000);
  
  // Check if menu content is now showing
  const bodyText = await page.locator('body').textContent();
  
  // Check for menu items that should appear if the fix worked
  const hasMenuItems = bodyText.includes('Thịt kho tàu') || 
                       bodyText.includes('Chả lá lốt') || 
                       bodyText.includes('Cá kho tộ') ||
                       bodyText.includes('Gà nướng đất sét');
  
  console.log('Has actual menu items:', hasMenuItems);
  console.log('Body preview:', bodyText.substring(0, 800));
  
  // Check specifically for "Chưa có menu" which indicates the bug
  const hasChuaCoMenu = bodyText.includes('Chưa có menu');
  console.log('Has "Chưa có menu":', hasChuaCoMenu);
  
  await browser.close();
})();
