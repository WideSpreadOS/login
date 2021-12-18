const express = require('express');
const router = express.Router();

const {ensureAuthenticated } = require('../config/auth');
const User = require('../models/User');


const axios = require('axios');
const cheerio = require('cheerio');

const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

router.get('/', (req, res) => {

    var options = {
        method: 'GET',
        url: 'https://newscatcher.p.rapidapi.com/v1/sources',
        params: { lang: 'en' },
        headers: {
            'x-rapidapi-host': 'newscatcher.p.rapidapi.com',
            'x-rapidapi-key': '7e45ec5e4fmsh4f3dac417f9eaa7p179a33jsnbfe4cb2e4c79'
        }
    };

    axios.request(options).then(function (response) {
        console.log(response.data);
        const returnedData = response.data;
        res.render('news-home', {returnedData})
    }).catch(function (error) {
        console.error(error);
    });
});

router.post('/search', (req, res) => {
    const term = req.body.searchQuery;
    res.redirect(`/news/search/${term}`);
});

router.get('/search/:searchTerm', (req, res) => {
    const searchTerm = req.params.searchTerm
    var options = {
        method: 'GET',
        url: 'https://newscatcher.p.rapidapi.com/v1/search_free',
        params: { q: `${searchTerm}`, lang: 'en', media: 'True' },
        headers: {
            'x-rapidapi-host': 'newscatcher.p.rapidapi.com',
            'x-rapidapi-key': '7e45ec5e4fmsh4f3dac417f9eaa7p179a33jsnbfe4cb2e4c79'
        }
    };

    axios.request(options).then(function (response) {
        console.log(response.data);
        const returnedData = response.data;
        res.render('news-search-results', {returnedData})
    }).catch(function (error) {
        console.error(error);
    });
})
router.get('/international', (req, res) => {
    const country = 'U.S.';

    newsapi.v2.topHeadlines({
        language: 'en',
        country: 'us'
      }).then(response => {
        res.render('news-international', {currentPageTitle: 'News', response, country});
    });
});
router.post('/international', (req, res) => {
    const country = req.body.country;

        res.redirect(`/news/international/${country}`);
});
router.get('/international/:country', (req, res) => {
    const country = req.params.country;

    newsapi.v2.topHeadlines({
        category: 'general',
        language: 'en',
        country: `${country}`
      }).then(response => {
        console.log(response)
        res.render('news-international', {currentPageTitle: 'News', response, country});
    });
});


router.get('/newsmax', (req, res) => {
    axios.get("https://www.newsmax.com/newsfront/").then(function(response) {
        const $ = cheerio.load(response.data);
        const results = [];
        

        $(".inside_cover_content").children('ul').children('li').each(function(i, element) {
        
        const articleImage = $(element).children('img').attr('src');
        const title = $(element).children('a').text();
        const newsPreview = $(element).children('#copy_small').text();
        const link = $(element).children('a').attr('href');
        
        results.push({
        articleImage: articleImage,
        title: title,
        link: link,
        newsPreview: newsPreview,
        });
        });

        res.render('news-newsmax', {currentPageTitle: 'Newsmax', results});
        });
});
    

router.get('/politics', (req, res) => {
    axios.get("https://www.foxnews.com/politics").then(function(response) {
        const $ = cheerio.load(response.data);
        const results = [];
        
        $(".article-list").children('.article').each(function(i, element) {
        
        const articleImage = $(element).children('.m').children('a').children('img').attr('src');
        const articleImageAlt = $(element).children('.m').children('a').children('img').attr('alt');
        
        const time = $(element).children('.info').children('.info-header').children('.meta').children('div').children('.time').text();
        const title = $(element).children('.info').children('.info-header').children('h4').text();
        const link = $(element).children('.info').children('.info-header').children('h4').children('a').attr('href');
        const newsPreview = $(element).children('.info').children('.content').children('p').children('a').text()

        results.push({
        articleImage: articleImage,
        articleImageAlt: articleImageAlt,
        title: title,
        link: link,
        newsPreview: newsPreview,
        time: time
        });
        });
        res.render('news-politics', {currentPageTitle: 'Politics', results});
        });
})



router.get('/technology', (req, res) => {
    axios.get("https://www.techradar.com/news").then(function(response) {
        const $ = cheerio.load(response.data);
        const results = [];

        $(".listingResults").children('.listingResult').each(function(i, element) {
            const articleImage = $(element).children('a').children('article').children('.image').children('figure').attr('data-original');
            const time = $(element).children('a').children('article').children('.content').children('header').children('.byline').children('time').text();
            const title = $(element).children('a').children('article').children('.content').children('header').children('.article-name').text();
            const newsPreview = $(element).children('a').children('article').children('.content').children('.synopsis').text()
            const link = $(element).children('a').attr('href');

            results.push({
                articleImage: articleImage,
                title: title,
                link: link,
                newsPreview: newsPreview,
                time: time
            });
        });
            res.render('news-technology', {currentPageTitle: 'Technology', results});
        })
    
});


/* Business */

router.get('/business', (req, res) => {
    axios.get("https://www.foxnews.com/business").then(function(response) {
        const $ = cheerio.load(response.data);
        const results = [];
        
        $(".article-list").children('.article').each(function(i, element) {
            const title = $(element).children('.info').children('.info-header').children('h3').text();
       
            const articleImage = $(element).children('.m').children('a').children('picture').children('source').attr('srcset');
            const articleImageAlt = $(element).children('.m').children('a').children('img').attr('alt');
            const time = $(element).children('.info').children('.info-header').children('.meta').children('div').children('.time').text();
            const link = $(element).children('.info').children('.info-header').children('h4').children('a').attr('href');
            const newsPreview = $(element).children('.info').children('.content').children('p').children('a').text()
        
            results.push({
            title: title,
            articleImage: articleImage,
            articleImageAlt: articleImageAlt,
            link: link,
            newsPreview: newsPreview,
            time: time 
            });
        });
    res.render('news-business', {currentPageTitle: 'Business News', results});
    });
});



router.get('/health', (req, res) => {
    axios.get("https://medicalxpress.com/").then(function(response) {
        const $ = cheerio.load(response.data);
        const results = [];

        $('.sorted-article').each(function(i, element) {
        
            const articleImage = $(element).children('figure').children('a').children('img').attr('src');
            const topic = $(element).children('.sorted-article-content').children('.sorted-article-topic').text();
            const title = $(element).children('.sorted-article-content').children('h2').children('a').text();
            const link = $(element).children('.sorted-article-content').children('h2').children('a').attr('href');
            const newsPreview = $(element).children('.sorted-article-content').children('p').text();
            const time = $(element).children('.sorted-article-content').children('.article__info').children('.mr-auto').children('p').text();

            results.push({
            articleImage: articleImage,
            topic: topic,
            title: title,
            link: link,
            newsPreview: newsPreview,
            time: time 
            });
        });
    res.render('news-health', {currentPageTitle: 'Health', results});
    });
});


router.get('/weather', ensureAuthenticated, async (req, res) => {
    const id = req.user._id;
    const user = await User.findById(id);
    const userZip = user.zip;
    const userUnits = user.measuring_system;
    const weatherKey = process.env.WEATHER_API_KEY;
    const options = {
        method: 'GET',
        url: `http://api.openweathermap.org/data/2.5/weather?zip=${userZip},us&units=imperial&APPID=${weatherKey}`
    };
    const weather = await axios.request(options).then(function (response) {
      const returnedData = response.data;
      console.log(`Current Weather: ${weather}`);
      return returnedData;
    }).catch(function (error) {
        console.error(error);
    }); 
    const forecastOptions = {
        method: 'GET',
        url: `http://api.openweathermap.org/data/2.5/forecast?zip=${userZip},us&units=imperial&APPID=${weatherKey}`
    };
    const forecast = await axios.request(forecastOptions).then(function (response) {
        const returnedData = response.data;
        console.log(`Weather Forecast: ${forecast}`);
        return returnedData;
      }).catch(function (error) {
        console.error(error);
      }); 

    res.render('weather-home', {weather, forecast});
});


module.exports = router;

/* 

                BLANK SCRAPING SETUP FOR NEWS

router.get('/newsCatagory', (req, res) => {
    axios.get("URL").then(function(response) {
        const $ = cheerio.load(response.data);
        const results = [];
        $(".articleList").children('.article').each(function(i, element) {
        
        const articleImage = $(element).children('').children('img').attr('src');
        const articleImageAlt = $(element).children('').children('img').attr('alt');
        
        const time = $(element).children('').text();
        const title = $(element).children('').text();
        const link = $(element).children('').children('a').attr('href');
        const newsPreview = $(element).children('').text()

        results.push({
        articleImage: articleImage,
        articleImageAlt: articleImageAlt,
        title: title,
        link: link,
        newsPreview: newsPreview,
        time: time
        });
        });
        // Log the results once you've looped through each of the elements found with cheerio
        console.log(results);
        res.render('news-', {currentPageTitle: ' News', results});
        });
});

*/
