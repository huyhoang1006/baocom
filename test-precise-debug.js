const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login via API to get proper session
  await page.request.post('http://localhost:3000/api/auth/login', {
    data: { username: 'admin', password: 'admin123' }
  });
  
  // Now go to dashboard directly
  const response = await page.request.get('http://localhost:3000/dashboard');
  console.log('Dashboard page status:', response.status());
  
  // Check actual page content
  const html = await page.content();
  console.log('Page title:', await page.title());
  console.log('Has "Thực Đơn":', html.includes('Thực Đơn'));
  console.log('Has "Tuần này":', html.includes('Tuần này'));
  
  await browser.close();
})();
