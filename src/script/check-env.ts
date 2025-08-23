import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

function checkEnvironment() {
  console.log('🔍 Checking Environment Variables...');
  console.log('================================');

  const required = ['OPENAI_API_KEY'];
  const optional = ['QDRANT_URL', 'QDRANT_API_KEY'];

  console.log('\n📋 Required Variables:');
  required.forEach((key) => {
    const value = process.env[key];
    console.log(`${key}: ${value ? '✅ Set' : '❌ Missing'}`);
  });

  console.log('\n📋 Optional Variables:');
  optional.forEach((key) => {
    const value = process.env[key];
    console.log(`${key}: ${value ? '✅ Set' : '⚪ Not set'}`);
  });

  console.log('\n🔧 OpenAI API Key Preview:');
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    console.log(
      `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
    );
  } else {
    console.log('❌ API Key not found');
  }
}

checkEnvironment();
