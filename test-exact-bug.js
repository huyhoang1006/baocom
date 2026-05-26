const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor network requests
  page.on('response', resp => {
    if (resp.url().includes('api/')) {
      console.log('API:', resp.url(), resp.status());
    }
  });
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Wait for React to render
  await page.waitForTimeout(4000);
  
  // Get the exact HTML structure
  const html = await page.content();
  
  // Find the day selector area
  const daySelectorStart = html.indexOf('class="flex gap-3');
  const daySelectorEnd = html.indexOf('</div>', daySelectorStart + 100);
  const daySelectorHtml = html.substring(daySelectorStart, daySelectorEnd + 6);
  console.log('Day selector HTML:', daySelectorHtml.substring(0, 500));
  
  // Find the menu content area
  const menuContentStart = html.indexOf('class="rounded-[18px]"');
  const menuContentEnd = html.indexOf('class="p-5 space-y-5"', menuContentStart + 100);
  const menuContentHtml = html.substring(menuContentStart, menuContentEnd + 100);
  console.log('\nMenu content HTML:', menuContentHtml.substring(0, 500));
  
  // Check for loading indicator
  console.log('\nHas loading text:', html.includes('Đang tải'));
  
  await browser.close();
})();
