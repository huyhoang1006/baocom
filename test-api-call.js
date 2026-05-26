const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all API responses
  page.on('response', resp => {
    if (resp.url().includes('api/')) {
      console.log('API Response:', resp.url(), resp.status());
    }
  });
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Get the API response body for daily-menus
  const apiResp = await page.request.get('http://localhost:3000/api/daily-menus?take=5');
  const body = await apiResp.text();
  console.log('\nAPI response full body:', body);
  
  // Get the week dates from the page
  const weekDateKeys = await page.evaluate(() => {
    const today = new Date();
    const monday = new Date(today);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    
    const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
    const toDateKey = (date) => {
      const vietnamDate = new Date(date.getTime() + VIETNAM_OFFSET_MS);
      const year = vietnamDate.getUTCFullYear();
      const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(toDateKey(d));
    }
    return dates;
  });
  console.log('\nWeek date keys:', weekDateKeys);
  
  // Parse the menus and check dates
  const menus = JSON.parse(body).menus;
  console.log('\nMenu dates from API:');
  for (const menu of menus) {
    console.log(`  ${menu.date}`);
  }
  
  await browser.close();
})();
