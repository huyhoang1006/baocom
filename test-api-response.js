const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'admin');
  await page.fill('input[placeholder="Mật khẩu"]', 'admin123');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForURL(/admin\/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Get the API response
  const apiResp = await page.request.get('http://localhost:3000/api/daily-menus?take=10');
  const body = await apiResp.text();
  const data = JSON.parse(body);
  
  // Check exact menu for 2026-05-18
  console.log('All menus:');
  for (const menu of data.menus) {
    const menuDate = new Date(menu.date);
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayOfWeek = dayNames[menuDate.getDay()];
    console.log(`${menu.date} (${dayOfWeek}) - ${menu.meals.length} meals`);
    if (menu.meals.length > 0) {
      console.log(`  Meals: ${menu.meals.map(m => m.meal.name).join(', ')}`);
    }
  }
  
  await browser.close();
})();
