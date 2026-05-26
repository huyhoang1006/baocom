await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
const url = page.url();
console.log('URL after submit:', url);
if (url.includes('/admin/dashboard') || url.includes('/dashboard')) {
  console.log('SUCCESS: Login redirected correctly');
} else {
  console.log('FAILED: Login did not redirect');
}