const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Wait for dashboard to fully render
  await page.waitForTimeout(3000);
  
  // Check what's displayed
  const bodyText = await page.locator('body').textContent();
  
  // Check the day selector buttons
  const dayButtons = await page.locator('button').allTextContents();
  console.log('All buttons:', dayButtons);
  
  // Check for menu content
  console.log('\nMenu content check:');
  console.log('  "Thứ 2":', bodyText.includes('Thứ 2'));
  console.log('  "Thứ 3":', bodyText.includes('Thứ 3'));
  console.log('  "Thịt kho tàu":', bodyText.includes('Thịt kho tàu'));
  console.log('  "Chả lá lốt":', bodyText.includes('Chả lá lốt'));
  console.log('  "Chưa có menu":', bodyText.includes('Chưa có menu'));
  console.log('  "Cá kho tộ":', bodyText.includes('Cá kho tộ'));
  
  // Get the exact menu section text
  const menuSection = bodyText.indexOf('Món chính');
  if (menuSection > 0) {
    console.log('\nMenu section text:', bodyText.substring(menuSection - 50, menuSection + 200));
  }
  
  await browser.close();
})();
