const baseUrl = process.env.API_URL || 'http://localhost:4000';

async function run() {
  const response = await fetch(`${baseUrl}/api/health`);

  if (!response.ok) {
    throw new Error(`Health endpoint failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log('Health OK:', data);

  const uid = Date.now();
  const registerPayload = {
    firstName: 'Smoke',
    lastName: 'Tester',
    username: `smoke_${uid}`,
    email: `smoke_${uid}@example.com`,
    phone: `+216${uid.toString().slice(-8)}`,
    password: 'smokePass123',
    avatar: 'S',
  };

  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });
  if (!registerRes.ok) {
    throw new Error(`Register failed with status ${registerRes.status}`);
  }
  const registerData = await registerRes.json();

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: registerPayload.email, password: registerPayload.password }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  const loginData = await loginRes.json();

  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  if (!meRes.ok) {
    throw new Error(`Me failed with status ${meRes.status}`);
  }

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  if (!logoutRes.ok) {
    throw new Error(`Logout failed with status ${logoutRes.status}`);
  }

  console.log('Auth smoke OK:', {
    registered: registerData.user?.email,
    loggedIn: loginData.user?.email,
  });
}

run().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
