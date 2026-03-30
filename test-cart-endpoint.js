const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testCartEndpoint() {
  try {
    console.log('🧪 Test de l\'endpoint /cart\n');

    // 1. Login
    console.log('1️⃣  Connexion...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'client1@test.com',
      password: 'client123'
    });
    
    const token = loginRes.data.data.token;
    const userId = loginRes.data.data.user._id;
    console.log(`✅ Connecté: ${loginRes.data.data.user.email}\n`);

    // 2. Get first product
    console.log('2️⃣  Récupération d\'un produit...');
    const productsRes = await axios.get(`${API_URL}/products?limit=1`);
    const productId = productsRes.data.data[0]._id;
    console.log(`✅ Produit trouvé: ${productsRes.data.data[0].name}\n`);

    // 3. Add to cart
    console.log('3️⃣  Ajout au panier...');
    const addRes = await axios.post(
      `${API_URL}/cart`,
      { productId, quantity: 1 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Réponse du serveur:`, JSON.stringify(addRes.data, null, 2));
    console.log(`\n   Nombre d'articles: ${addRes.data.data?.items?.length || 0}`);
    console.log(`   Total: ${addRes.data.data?.total || 0} FCFA\n`);

    // 4. Get cart
    console.log('4️⃣  Récupération du panier...');
    const cartRes = await axios.get(
      `${API_URL}/cart`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Panier récupéré:`, JSON.stringify(cartRes.data, null, 2));

    console.log('\n✅ Tous les tests sont passés !');
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    process.exit(1);
  }
}

testCartEndpoint();
