const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"], input[placeholder="Tên đăng nhập"]', 'admin');
  await page.fill('input[name="password"], input[placeholder="Mật khẩu"]', 'admin123');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  
  console.log('After login URL:', page.url());
  
  // Go to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  console.log('Dashboard URL:', page.url());
  
  // Wait a bit for any JS to execute
  await page.waitForTimeout(2000);
  
  // Check for loading state
  const loadingText = await page.locator('text=Đang tải').count();
  console.log('Loading text count:', loadingText);
  
  // Check the main content
  const mainContent = await page.locator('main').innerHTML().catch(() => 'no main element');
  console.log('Main content length:', mainContent.length);
  console.log('Main content preview:', mainContent.substring(0, 500));
  
  // Check for day tabs
  const dayTabs = await page.locator('button:has-text("T2"), button:has-text("T3"), button:has-text("T4"), button:has-text("T5"), button:has-text("T6")').count();
  console.log('Day tabs count:', dayTabs);
  
  // Check network requests for daily-menus
  const dailyMenusResponse = await page.waitForResponse(resp => resp.url().includes('daily-menus'), { timeout: 5000 }).catch(() => null);
  if (dailyMenusResponse) {
    console.log('daily-menus response status:', dailyMenusResponse.status());
    console.log('daily-menus response body:', await dailyMenusResponse.text().catch(() => 'failed to read'));
  } else {
    console.log('No daily-menus response captured');
  }
  
  await browser.close();
})();
