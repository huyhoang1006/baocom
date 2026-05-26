const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login as employee (hungpx)
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  console.log('Logged in as employee, URL:', page.url());
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Wait for data to load
  await page.waitForTimeout(3000);
  
  // Get all text content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text preview:', bodyText?.substring(0, 800));
  
  // Get specific elements
  const dayTabs = await page.locator('button:has-text("T2"), button:has-text("T3"), button:has-text("T4"), button:has-text("T5"), button:has-text("T6")').allTextContents();
  console.log('Day tabs:', dayTabs);
  
  // Get menu content
  const menuContent = await page.locator('[class*="rounded-[18px]"][class*="bg-surface"]').count();
  console.log('Menu content cards:', menuContent);
  
  // Check if there are loading indicators
  const loadingIndicators = await page.locator('.animate-pulse').count();
  console.log('Loading pulse indicators:', loadingIndicators);
  
  await browser.close();
})();
