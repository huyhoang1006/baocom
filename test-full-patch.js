async function test() {
  // Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    redirect: 'manual'
  })
  
  const cookie = loginRes.headers.get('set-cookie')
  console.log('Cookie:', cookie ? 'present' : 'missing')
  
  // Simulate exactly what frontend does - send name only
  const body = { name: 'Test User' }
  console.log('Sending:', JSON.stringify(body))
  
  const res = await fetch('http://localhost:3000/api/users/cmpi0fga600014sv6y4pf76sy', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie || ''
    },
    body: JSON.stringify(body)
  })
  
  console.log(`Status: ${res.status}`)
  console.log('Response:', JSON.stringify(await res.json()))
}

test().catch(console.error)
