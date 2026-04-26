// Script de test pour l'API
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';

async function testAPI() {
  console.log('🧪 Test de l\'API HKEYA Backend\n');
  
  try {
    // Test 1: Health check
    console.log('1. Test Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData.ok ? 'OK' : 'FAILED');
    
    // Test 2: Login
    console.log('\n2. Test Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'user@iit.tn',
        password: 'whisper123'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login:', loginData.ok ? 'OK' : 'FAILED');
    
    if (!loginData.ok) {
      console.log('❌ Impossible de continuer sans token');
      return;
    }
    
    const token = loginData.token;
    console.log('🔑 Token obtenu');
    
    // Test 3: Créer un post
    console.log('\n3. Test Création Post...');
    const postResponse = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Post',
        content: 'Ceci est un post de test créé via l\'API',
        topic: 'Technologie'
      })
    });
    const postData = await postResponse.json();
    console.log('✅ Création Post:', postData.ok ? 'OK' : 'FAILED');
    
    if (postData.ok) {
      console.log('📝 Post ID:', postData.post.id);
    }
    
    // Test 4: Login Moderateur
    console.log('\n4. Test Login Moderateur...');
    const modLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'modo@iit.tn',
        password: 'whisper123'
      })
    });
    const modLoginData = await modLoginResponse.json();
    console.log('✅ Login Moderateur:', modLoginData.ok ? 'OK' : 'FAILED');
    
    if (modLoginData.ok) {
      const modToken = modLoginData.token;
      
      // Test 5: Récupérer posts en attente
      console.log('\n5. Test Posts en Attente...');
      const pendingResponse = await fetch(`${BASE_URL}/api/posts/pending`, {
        headers: { 'Authorization': `Bearer ${modToken}` }
      });
      const pendingData = await pendingResponse.json();
      console.log('✅ Posts en Attente:', pendingData.ok ? 'OK' : 'FAILED');
      console.log('📊 Nombre de posts en attente:', pendingData.posts?.length || 0);
      
      // Test 6: Approuver le post (si il existe)
      if (postData.ok && postData.post) {
        console.log('\n6. Test Approbation Post...');
        const approveResponse = await fetch(`${BASE_URL}/api/posts/${postData.post.id}/approve`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${modToken}` }
        });
        const approveData = await approveResponse.json();
        console.log('✅ Approbation:', approveData.ok ? 'OK' : 'FAILED');
      }
    }
    
    console.log('\n🎉 Tests terminés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testAPI();