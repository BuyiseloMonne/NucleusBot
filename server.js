const express = require('express');
const path = require('path');
require('dotenv').config();
const openaiService = require('./services/openaiService');


const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the EJS template
app.get('/', (req, res) => {
  res.render('index');
});

// Handle chat requests
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).send('No message provided');
  }

  try {
    const chatResponse = await openaiService.getChatResponse(userMessage);
    res.json({ reply: chatResponse });
  } catch (error) {
    res.status(500).send('Error communicating with OpenAI API');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
