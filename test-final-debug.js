const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all responses to inspect exact data
  page.on('response', async resp => {
    if (resp.url().includes('daily-menus')) {
      console.log('daily-menus response:', resp.status());
      const body = await resp.text();
      const data = JSON.parse(body);
      console.log('Number of menus:', data.menus.length);
      for (const menu of data.menus) {
        console.log(`  Menu date: ${menu.date}, meals count: ${menu.meals.length}`);
        if (menu.meals.length > 0) {
          console.log(`    First meal: ${menu.meals[0].meal.name}`);
        }
      }
    }
  });
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Final check of what's displayed
  const bodyText = await page.locator('body').textContent();
  console.log('\nDisplayed text check:');
  console.log('  Has "Thịt kho tàu":', bodyText.includes('Thịt kho tàu'));
  console.log('  Has "Chả lá lốt":', bodyText.includes('Chả lá lốt'));
  console.log('  Has "Chưa có menu":', bodyText.includes('Chưa có menu'));
  
  await browser.close();
})();
