const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages to see what React is doing
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('PAGE LOG:', msg.text());
    }
  });
  
  // Add error logging
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForLoadState('networkidle');
  
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Wait longer for full React hydration and HMR
  await page.waitForTimeout(5000);
  
  // Check what's actually in the DOM
  const mainElement = await page.locator('main').first();
  const html = await mainElement.innerHTML();
  console.log('Main element innerHTML:', html.substring(0, 500));
  
  // Check for loading state
  const loadingDivs = await page.locator('.animate-pulse').count();
  console.log('Pulse animations:', loadingDivs);
  
  // Check what the actual rendered buttons say
  const dayButtons = await page.locator('button').allTextContents();
  console.log('Day buttons:', dayButtons.filter(t => t.match(/^[2-6]$/)));
  
  await browser.close();
})();
