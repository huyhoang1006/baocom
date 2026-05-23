import { test as base, Page, APIRequestContext } from '@playwright/test';
import { loginViaApi, getCookieHeader } from '../utils/api-helpers';

export interface AuthContext {
  page: Page;
  request: APIRequestContext;
  cookies: string[];
  user: { id: string; username: string; name: string; role: string };
}

export const TEST_USERS = {
  admin: { username: 'admin', password: 'admin123' },
  employee: { username: 'hungpx', password: '123456' },
} as const;

export const test = base.extend<{ authenticatedAdmin: AuthContext; authenticatedEmployee: AuthContext }>({
  authenticatedAdmin: async ({ page, request }, use) => {
    const response = await loginViaApi(request, TEST_USERS.admin.username, TEST_USERS.admin.password);
    await page.context().addCookies([
      { name: 'token', value: response.cookies[0]?.split('=')[1] || '', domain: '127.0.0.1', path: '/' }
    ]);
    await use({ page, request, cookies: response.cookies, user: response.user });
  },
  authenticatedEmployee: async ({ page, request }, use) => {
    const response = await loginViaApi(request, TEST_USERS.employee.username, TEST_USERS.employee.password);
    await page.context().addCookies([
      { name: 'token', value: response.cookies[0]?.split('=')[1] || '', domain: '127.0.0.1', path: '/' }
    ]);
    await use({ page, request, cookies: response.cookies, user: response.user });
  },
});

export { expect } from '@playwright/test';