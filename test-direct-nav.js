const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login first to get session cookie
  const loginResp = await page.request.post('http://localhost:3000/api/auth/login', {
    data: { username: 'hungpx', password: '123456' }
  });
  console.log('Login status:', loginResp.status());
  
  // Get cookies from login response
  const loginBody = await loginResp.json();
  console.log('Login response:', loginBody.user ? 'success' : 'failed');
  
  // Use goto to navigate to dashboard with the session cookie
  // First just go to login page to establish context
  await page.goto('http://localhost:3000/login');
  
  // Now navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Current URL:', url);
  
  const bodyText = await page.locator('body').textContent();
  console.log('Has "Thực Đơn Tuần này":', bodyText.includes('Thực Đơn Tuần này'));
  console.log('Has "hungpx":', bodyText.includes('hungpx'));
  console.log('Has "Chưa có menu":', bodyText.includes('Chưa có menu'));
  
  // Check if we're on the login page or dashboard
  if (url.includes('login')) {
    console.log('REDIRECTED TO LOGIN - session expired or not established');
  }
  
  await browser.close();
})();
