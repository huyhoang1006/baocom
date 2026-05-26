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
  
  const menuItems = ['Thịt kho tàu', 'Chả lá lốt', 'Cá kho tộ', 'Gà nướng đất sét', 
                     'Cải xào', 'Rau muống luộc', 'Thịt gà rang', 
                     'Chưa có menu', 'Chưa có món rau'];
  
  console.log('Menu content check after fix:');
  for (const item of menuItems) {
    console.log(`  ${item}: ${bodyText.includes(item) ? 'FOUND' : 'not found'}`);
  }
  
  await browser.close();
})();
