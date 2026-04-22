const baseUrl = process.env.API_URL || 'http://localhost:4000';

async function run() {
  const response = await fetch(`${baseUrl}/api/health`);

  if (!response.ok) {
    throw new Error(`Health endpoint failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log('Smoke test OK:', data);
}

run().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
