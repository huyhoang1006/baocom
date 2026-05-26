const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Get all day tab buttons
  const dayTabs = await page.locator('button:has-text("2"), button:has-text("3"), button:has-text("4"), button:has-text("5"), button:has-text("6")').all();
  console.log('Day tabs count:', dayTabs.length);
  
  // Click each day tab and check content
  for (let i = 0; i < dayTabs.length; i++) {
    await dayTabs[i].click();
    await page.waitForTimeout(500);
    
    const bodyText = await page.locator('body').textContent();
    
    // Find the menu content
    const mainMatch = bodyText.match(/Món chính\n([^\n]+)/);
    const menuContent = mainMatch ? mainMatch[1] : 'not found';
    console.log(`Day ${i+2}: ${menuContent}`);
  }
  
  await browser.close();
})();
