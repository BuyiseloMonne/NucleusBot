const axios = require('axios');
require('dotenv').config();

// Function to get a response from OpenAI API
async function getChatResponse(userMessage) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // here i am going to use fine tuned model id
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
   
    throw new Error('Error communicating with OpenAI API');
  }
}

module.exports = {
  getChatResponse
};
