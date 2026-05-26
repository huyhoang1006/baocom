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
  await page.waitForTimeout(4000); // Wait longer for HMR to fully update
  
  const bodyText = await page.locator('body').textContent();
  
  // Check if any menu items show actual content
  const menuItems = ['Thịt kho tàu', 'Chả lá lốt', 'Cá kho tộ', 'Gà nướng đất sét', 
                     'Cải xào', 'Rau muống luộc', 'Thịt gà rang', 
                     'Chưa có menu', 'Chưa có món rau'];
  
  console.log('Menu content check:');
  for (const item of menuItems) {
    console.log(`  ${item}: ${bodyText.includes(item) ? 'FOUND' : 'not found'}`);
  }
  
  // Also check the exact API response
  const apiResp = await page.request.get('http://localhost:3000/api/daily-menus?take=5');
  console.log('\nAPI response status:', apiResp.status());
  const body = await apiResp.text();
  console.log('API response:', body.substring(0, 300));
  
  await browser.close();
})();
