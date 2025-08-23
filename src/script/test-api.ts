// Create this file to test your API directly
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testAPI() {
  console.log('🧪 Testing Chat API...');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is Node.js?' }],
      }),
    });

    console.log('Response status:', response.status);
    console.log(
      'Response headers:',
      Object.fromEntries(response.headers.entries()),
    );

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      console.log('📡 Streaming response:');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        process.stdout.write(chunk);
      }
    }
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testAPI();
