const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const openaiService = require('./services/openaiService');

const app = express();
const port = 3000; // Using a single port

// Middleware to parse JSON bodies and handle CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// In-memory storage for scraped content
let scrapedData = {};

// URLs to scrape
const urls = [
  'https://edu.gcfglobal.org/en/computerbasics/what-is-a-computer/1/'
];

// Route to perform scraping
app.get('/scrape', async (req, res) => {
  try {
    const results = await Promise.all(urls.map(async (url) => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

       // Extract text content excluding header and footer
       const textContent = await page.evaluate(() => {
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');

        // Hide header and footer temporarily
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';

        // Get the text content of the body excluding header and footer
        const content = document.body.innerText;

        // Restore header and footer visibility
        if (header) header.style.display = '';
        if (footer) footer.style.display = '';

        return content;
      });

      await browser.close();
      scrapedData[url] = textContent;
      return { url, textContent };
    }));

    // Send the scraping results as JSON
    res.json(results);
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).send('An error occurred while scraping the pages');
  }
});

// Route to return the scraped content
app.get('/getContent', (req, res) => {
  // Send the scraped data as JSON
  res.json(scrapedData);
});

// Serve the EJS template
app.get('/', (req, res) => {
  res.render('index');
});

// Handle chat requests
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const responseLimit = 300; // Character limit for the response

  if (!userMessage) {
    return res.status(400).send('No message provided');
  }

  // Function to find the best matching snippet
  const findBestMatch = (text, query) => {
    const queryLower = query.toLowerCase();
    const index = text.toLowerCase().indexOf(queryLower);
    if (index === -1) return null;

    // Extract a snippet around the match
    const start = Math.max(0, index - 50); // 50 characters before the match
    const end = Math.min(text.length, start + responseLimit); // Limit response length
    return text.slice(start, end);
  };

  // Check if the user message relates to the scraped content
  for (const [url, textContent] of Object.entries(scrapedData)) {
    const snippet = findBestMatch(textContent, userMessage);
    if (snippet) {
      return res.json({ reply: snippet });
    }
  }


  try {
    // If no match, fallback to OpenAI API
    const chatResponse = await openaiService.getChatResponse(userMessage);
    res.json({ reply: chatResponse });
  } 
  catch (error) {
    res.status(500).send('Error communicating with OpenAI API');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
