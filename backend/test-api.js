const axios = require('axios');
require('dotenv').config();

async function testAPI() {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Hola, responde con 'OK' si me escuchas" }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ API Funciona:', response.data.choices[0].message.content);
  } catch (error) {
    console.log('❌ Error API:', error.response?.data || error.message);
  }
}

testAPI();