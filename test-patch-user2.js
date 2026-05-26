async function test() {
  // First login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    redirect: 'manual'
  })
  
  const cookie = loginRes.headers.get('set-cookie')
  if (!cookie) {
    console.log('Login failed')
    return
  }
  console.log('Login OK')
  
  // Test with only name (what frontend sends for edit)
  const patchRes = await fetch('http://localhost:3000/api/users/cmpi0fga600014sv6y4pf76sy', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({ name: 'Updated Name' })
  })
  
  console.log(`PATCH with name only: ${patchRes.status}`)
  console.log(await patchRes.json())
}

test().catch(console.error)
