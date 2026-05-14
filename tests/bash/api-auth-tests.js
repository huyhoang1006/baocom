#!/usr/bin/env node
/**
 * BaoCom API Authentication Test Suite
 * Standard: IEEE 829-2008
 * Version: 1.0
 * Date: 2026-05-14
 */

const http = require('http');

const BASE_URL = 'localhost:3000';
let PASS = 0;
let FAIL = 0;
let adminCookie = '';
let employeeCookie = '';

function makeRequest(path, method = 'GET', body = null, cookie = null) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (cookie) headers['Cookie'] = cookie;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          // Extract Set-Cookie header
          const setCookie = res.headers['set-cookie'];
          if (setCookie) {
            console.log('    Set-Cookie received:', setCookie[0]?.substring(0, 50) + '...');
          }
          resolve({ status: res.statusCode, body: responseBody, setCookie });
        });
      }
    );
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

function extractToken(setCookie) {
  if (!setCookie) return null;
  const match = setCookie[0]?.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
}

function checkResponse(testName, expectedStatus, actualStatus, response) {
  console.log(`Testing: ${testName}`);
  console.log(`  Expected: HTTP ${expectedStatus}`);
  console.log(`  Actual:   HTTP ${actualStatus}`);

  if (actualStatus === expectedStatus) {
    console.log('  \x1b[32mPASS\x1b[0m');
    PASS++;
  } else {
    console.log('  \x1b[31mFAIL\x1b[0m');
    console.log(`  Response: ${response}`);
    FAIL++;
  }
  console.log('---');
}

async function runTests() {
  console.log('=== Checking server availability ===');
  const serverCheck = await makeRequest('/api/auth');
  if (serverCheck.status === 0) {
    console.log('\x1b[31mERROR: Server not available at localhost:3000\x1b[0m');
    console.log('Please start the dev server: npm run dev');
    process.exit(1);
  }
  console.log('\x1b[32mServer is running\x1b[0m\n');
  console.log('---');

  // TC-AUTH-001: Login Success - Admin
  console.log('=== TC-AUTH-001: Login Success - Admin ===');
  let response = await makeRequest('/api/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123',
  });
  checkResponse('TC-AUTH-001', 200, response.status, response.body);
  adminCookie = extractToken(response.setCookie);
  console.log('    Admin cookie:', adminCookie?.substring(0, 50) + '...');

  // TC-AUTH-002: Login Success - Employee
  console.log('=== TC-AUTH-002: Login Success - Employee ===');
  response = await makeRequest('/api/auth/login', 'POST', {
    username: 'nguyenvana',
    password: 'employee123',
  });
  checkResponse('TC-AUTH-002', 200, response.status, response.body);
  employeeCookie = extractToken(response.setCookie);
  console.log('    Employee cookie:', employeeCookie?.substring(0, 50) + '...');

  // TC-AUTH-003: Login Failure - Invalid Password
  console.log('\n=== TC-AUTH-003: Login Failure - Invalid Password ===');
  response = await makeRequest('/api/auth/login', 'POST', {
    username: 'admin',
    password: 'wrongpassword',
  });
  checkResponse('TC-AUTH-003', 401, response.status, response.body);

  // TC-AUTH-004: Login Failure - Missing Fields
  console.log('=== TC-AUTH-004: Login Failure - Missing Fields ===');
  response = await makeRequest('/api/auth/login', 'POST', {
    username: 'admin',
  });
  checkResponse('TC-AUTH-004', 400, response.status, response.body);

  // TC-AUTH-005: Auth Health Check
  console.log('=== TC-AUTH-005: Auth Health Check ===');
  response = await makeRequest('/api/auth');
  checkResponse('TC-AUTH-005', 200, response.status, response.body);

  // TC-AUTH-401-001: No Token
  console.log('\n=== TC-AUTH-401-001: No Token ===');
  response = await makeRequest('/api/auth/me');
  checkResponse('TC-AUTH-401-001', 401, response.status, response.body);

  // TC-AUTH-401-002: Invalid Token
  console.log('=== TC-AUTH-401-002: Invalid Token ===');
  response = await makeRequest('/api/auth/me', 'GET', null, 'token=invalid-token-format');
  checkResponse('TC-AUTH-401-002', 401, response.status, response.body);

  // TC-AUTH-403-001: Employee Access Admin Stats (403)
  console.log('\n=== TC-AUTH-403-001: Employee Access Admin Stats ===');
  response = await makeRequest('/api/admin/stats', 'GET', null, employeeCookie);
  checkResponse('TC-AUTH-403-001', 403, response.status, response.body);

  // TC-AUTH-403-002: Employee Access Admin Users (403)
  console.log('=== TC-AUTH-403-002: Employee Access Admin Users ===');
  response = await makeRequest('/api/users', 'GET', null, employeeCookie);
  checkResponse('TC-AUTH-403-002', 403, response.status, response.body);

  // TC-AUTH-403-003: Employee Access Admin POST (403)
  console.log('=== TC-AUTH-403-003: Employee Access Admin POST ===');
  response = await makeRequest('/api/daily-menus', 'POST', { date: '2026-05-20' }, employeeCookie);
  checkResponse('TC-AUTH-403-003', 403, response.status, response.body);

  // TC-USER-001: Get Current User (Me)
  console.log('\n=== TC-USER-001: Get Current User ===');
  response = await makeRequest('/api/auth/me', 'GET', null, adminCookie);
  checkResponse('TC-USER-001', 200, response.status, response.body);

  // TC-USER-002: Get Daily Menus
  console.log('=== TC-USER-002: Get Daily Menus ===');
  response = await makeRequest('/api/daily-menus', 'GET', null, employeeCookie);
  checkResponse('TC-USER-002', 200, response.status, response.body);

  // TC-USER-003: Get Daily Menu by Date
  console.log('=== TC-USER-003: Get Daily Menu by Date ===');
  response = await makeRequest('/api/daily-menus/2026-05-20', 'GET', null, employeeCookie);
  const status3 = response.status === 200 || response.status === 404 ? 200 : response.status;
  checkResponse('TC-USER-003', 200, status3, response.body);

  // TC-USER-004: Get Registrations
  console.log('=== TC-USER-004: Get Registrations ===');
  response = await makeRequest('/api/registrations', 'GET', null, employeeCookie);
  checkResponse('TC-USER-004', 200, response.status, response.body);

  // TC-USER-005: Logout
  console.log('=== TC-USER-005: Logout ===');
  response = await makeRequest('/api/auth/logout', 'POST', null, adminCookie);
  checkResponse('TC-USER-005', 200, response.status, response.body);

  // TC-ADMIN-001: Admin Get Stats
  console.log('\n=== TC-ADMIN-001: Admin Get Stats ===');
  response = await makeRequest('/api/admin/stats', 'GET', null, adminCookie);
  checkResponse('TC-ADMIN-001', 200, response.status, response.body);

  // TC-ADMIN-002: Admin Get Users
  console.log('=== TC-ADMIN-002: Admin Get Users ===');
  response = await makeRequest('/api/users', 'GET', null, adminCookie);
  checkResponse('TC-ADMIN-002', 200, response.status, response.body);

  // TC-ADMIN-003: Admin Get Holidays
  console.log('=== TC-ADMIN-003: Admin Get Holidays ===');
  response = await makeRequest('/api/holidays', 'GET', null, adminCookie);
  checkResponse('TC-ADMIN-003', 200, response.status, response.body);

  // TC-ADMIN-004: Admin Get Meals
  console.log('=== TC-ADMIN-004: Admin Get Meals ===');
  response = await makeRequest('/api/meals', 'GET', null, adminCookie);
  checkResponse('TC-ADMIN-004', 200, response.status, response.body);

  // Summary
  console.log('\n==========================================');
  console.log('TEST SUMMARY');
  console.log('==========================================');
  console.log(`Passed: \x1b[32m${PASS}\x1b[0m`);
  console.log(`Failed: \x1b[31m${FAIL}\x1b[0m`);
  console.log('==========================================');

  if (FAIL === 0) {
    console.log('\x1b[32mAll tests passed!\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[31mSome tests failed!\x1b[0m');
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});