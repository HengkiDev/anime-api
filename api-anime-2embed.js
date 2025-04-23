
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Base URL
const BASE_URL = 'https://www.2embed.cc';

// Get anime list
app.get('/api/animelist', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/animelist`);
    const $ = cheerio.load(response.data);
    const animeList = [];

    $('.item').each((i, element) => {
      const title = $(element).find('.name').text().trim();
      const url = $(element).find('a').attr('href');
      const id = url ? url.split('/').pop() : '';
      const image = $(element).find('img').attr('src');
      
      animeList.push({
        id,
        title,
        image: image.startsWith('http') ? image : `${BASE_URL}${image}`,
        url: `${BASE_URL}${url}`
      });
    });

    return res.json({
      success: true,
      data: animeList
    });
  } catch (error) {
    console.error('Error fetching anime list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch anime list'
    });
  }
});

// Get anime details and embed
app.get('/api/anime/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/anime/${id}`);
    const $ = cheerio.load(response.data);
    
    const title = $('.movie-detail .title').text().trim();
    const description = $('.movie-detail .description').text().trim();
    const image = $('.movie-detail .poster img').attr('src');
    
    // Extract episode list if available
    const episodes = [];
    $('.episodes-list .item').each((i, element) => {
      const episodeTitle = $(element).find('.name').text().trim();
      const episodeUrl = $(element).find('a').attr('href');
      const episodeId = episodeUrl ? episodeUrl.split('/').pop() : '';
      
      episodes.push({
        id: episodeId,
        title: episodeTitle,
        url: `${BASE_URL}${episodeUrl}`,
      });
    });

    // Generate embed URL
    const embedUrl = `https://2anime.xyz/embed/${id}`;

    return res.json({
      success: true,
      data: {
        id,
        title,
        description,
        image: image?.startsWith('http') ? image : `${BASE_URL}${image}`,
        episodes,
        embedUrl,
        embedCode: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" scrolling="no" allowfullscreen></iframe>`
      }
    });
  } catch (error) {
    console.error('Error fetching anime details:', error);
    return res.status(500).json({
      success: false, 
      message: 'Failed to fetch anime details'
    });
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Anime API',
    endpoints: {
      animeList: '/api/animelist',
      animeDetails: '/api/anime/:id'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
