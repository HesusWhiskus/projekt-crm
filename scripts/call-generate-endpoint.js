// Skrypt do wywołania endpointu generowania danych testowych
// Uruchom: node scripts/call-generate-endpoint.js

const https = require('https');
const url = require('url');

const endpointUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/admin/generate-test-data`
  : 'https://projekt-crm-production.up.railway.app/api/admin/generate-test-data';

console.log('🚀 Wywoływanie endpointu generowania danych testowych...');
console.log('URL:', endpointUrl);
console.log('');
console.log('⚠️  UWAGA: Ten endpoint wymaga autoryzacji ADMIN.');
console.log('   Najlepiej wywołać go przez przeglądarkę po zalogowaniu jako ADMIN.');
console.log('');
console.log('W przeglądarce (F12 → Console):');
console.log(`
fetch('/api/admin/generate-test-data', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Sukces!', data);
  })
  .catch(err => console.error('❌ Błąd:', err));
`);

// Próba wywołania bez autoryzacji (pokaże 401)
const parsedUrl = url.parse(endpointUrl);
const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || 443,
  path: parsedUrl.path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 401) {
      console.log('✅ Endpoint jest dostępny! Status: 401 (Unauthorized)');
      console.log('   To oznacza, że endpoint działa, ale wymaga autoryzacji.');
      console.log('');
      console.log('📝 Aby wywołać endpoint:');
      console.log('   1. Zaloguj się jako ADMIN na Railway');
      console.log('   2. Otwórz konsolę przeglądarki (F12)');
      console.log('   3. Uruchom kod JavaScript powyżej');
    } else if (res.statusCode === 200) {
      console.log('✅ Sukces! Dane zostały wygenerowane.');
      console.log('Odpowiedź:', data);
    } else {
      console.log(`Status: ${res.statusCode}`);
      console.log('Odpowiedź:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Błąd:', error.message);
});

req.end();

