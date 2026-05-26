const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login properly
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  
  // Wait for navigation to dashboard
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const url = page.url();
  console.log('After login URL:', url);
  
  // Capture console messages
  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });
  
  // Wait for dashboard to render
  await page.waitForTimeout(3000);
  
  // Check for loading state
  const bodyText = await page.locator('body').textContent();
  console.log('Body text length:', bodyText.length);
  console.log('Has "Thực Đơn Tuần này":', bodyText.includes('Thực Đơn Tuần này'));
  console.log('Has "Chưa có menu":', bodyText.includes('Chưa có menu'));
  
  // Print any error logs
  const errors = logs.filter(l => l.type === 'error');
  if (errors.length > 0) {
    console.log('Error logs:', errors.map(e => e.text).join('\n'));
  }
  
  await browser.close();
})();
