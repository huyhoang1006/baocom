const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Add console logging from the page
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  
  // Navigate to dashboard and wait for API calls to complete
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Wait for React to render
  await page.waitForTimeout(2000);
  
  // Get the raw HTML structure to understand what's rendered
  const html = await page.content();
  
  // Find the main dashboard content area
  const dashboardStart = html.indexOf('Tuần này');
  const dashboardEnd = html.indexOf('self.__next_r=');
  const dashboardHtml = html.substring(dashboardStart, dashboardEnd > 0 ? dashboardEnd : dashboardStart + 2000);
  console.log('Dashboard HTML:', dashboardHtml.substring(0, 1000));
  
  // Look for specific patterns
  const hasT2Pattern = html.includes('T2")') || html.includes('T2","') || html.includes('button:has-text("T2")');
  console.log('\nHTML has T2 pattern:', hasT2Pattern);
  
  // Check network for exact API responses
  const dailyMenusResponse = await page.request.get('http://localhost:3000/api/daily-menus?take=5');
  const dailyMenusBody = await dailyMenusResponse.text();
  console.log('\nDaily menus API response:', dailyMenusBody.substring(0, 500));
  
  await browser.close();
})();
