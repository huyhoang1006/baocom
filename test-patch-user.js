const targetId = process.argv[2]
if (!targetId) {
  console.log('Usage: node test-patch-user.js <user-id>')
  process.exit(1)
}

async function test() {
  // First login to get cookie
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    redirect: 'manual'
  })
  
  const cookie = loginRes.headers.get('set-cookie')
  if (!cookie) {
    console.log('Login failed - no cookie')
    return
  }
  console.log('Login OK, cookie received')
  
  // Now test PATCH
  const patchRes = await fetch(`http://localhost:3000/api/users/${targetId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({ name: 'Test Update' })
  })
  
  console.log(`PATCH status: ${patchRes.status}`)
  const data = await patchRes.json()
  console.log('Response:', JSON.stringify(data, null, 2))
}

test().catch(console.error)
