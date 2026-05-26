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
  
  // Check the actual API response
  const apiResp = await page.request.get('http://localhost:3000/api/daily-menus?take=10');
  const body = await apiResp.text();
  const data = JSON.parse(body);
  
  console.log('Number of menus:', data.menus.length);
  
  // Group by dateKey
  const menusByDate = {};
  for (const menu of data.menus) {
    const date = new Date(menu.date);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    if (!menusByDate[dateKey]) menusByDate[dateKey] = [];
    menusByDate[dateKey].push({ date: menu.date, mealsCount: menu.meals.length });
  }
  
  console.log('\nMenus grouped by date:');
  for (const [dateKey, menus] of Object.entries(menusByDate)) {
    console.log(`${dateKey}: ${menus.length} entries`);
    for (const m of menus) {
      console.log(`  ${m.date}: ${m.mealsCount} meals`);
    }
  }
  
  await browser.close();
})();
