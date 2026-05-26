const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Tên đăng nhập"]', 'hungpx');
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.click('button:has-text("Đăng nhập")');
  
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  const bodyText = await page.locator('body').textContent();
  
  console.log('=== Employee Dashboard Menu Test ===');
  console.log('Page URL:', page.url());
  console.log('');
  console.log('Menu items check:');
  const menuItems = [
    'Thịt kho tàu',
    'Cải xào', 
    'Su su luộc',
    'Chuối',
    'Chả lá lốt',
    'Thịt gà rang',
    'Đỗ quả xào',
    'Dưa hấu',
    'Cá kho tộ',
    'Rau muống luộc',
    'Đậu phụ nhồi thịt',
    'Nước ép cam',
    'Gà nướng đất sét',
    'Cà rốt xào',
    'Bông cải hấp',
    'Kem vani'
  ];
  
  for (const item of menuItems) {
    console.log(`  ${item}: ${bodyText.includes(item) ? 'FOUND' : 'not found'}`);
  }
  
  console.log('');
  console.log('Day tab check (should show 2,3,4,5,6):');
  const buttons = await page.locator('button').allTextContents();
  const dayButtons = buttons.filter(b => /^[2-6]$/.test(b.trim()));
  console.log('  Day tabs:', dayButtons.join(', '));
  
  await browser.close();
})();
