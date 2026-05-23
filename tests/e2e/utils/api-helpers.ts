import { APIRequestContext } from '@playwright/test';

export interface LoginResponse {
  user: { id: string; username: string; name: string; role: string };
  cookies: string[];
}

export async function loginViaApi(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await request.post('/api/auth/login', {
    data: { username, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  const setCookie = response.headers()['set-cookie'] || '';
  const cookies = parseCookies(setCookie);

  return {
    user: await response.json(),
    cookies,
  };
}

export function parseCookies(setCookie: string): string[] {
  if (!setCookie) return [];
  return setCookie.split(',').map(c => c.split(';')[0].trim());
}

export function getCookieHeader(cookies: string[]): string {
  return cookies.join('; ');
}