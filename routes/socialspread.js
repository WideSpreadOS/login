const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {ensureAuthenticated } = require('../config/auth');

const axios = require('axios');
const { createClient } = require('pexels');
const User = require('../models/User');
const Post = require('../models/Post');

router.get('/', ensureAuthenticated, async (req, res) => {
    const id = req.user._id;
    const thisUser = await User.findById(id);
    const friendIds = req.user.friends;
    const posts = await Post.find({ "author": { "$in": friendIds } }).sort({ createdAt: 'desc' }).populate('comments');

    let checkAuthor = []
    const postAuthor = () => {
        for (i = 0; i < posts.length; i++) {
            posts[i].author.push(checkAuthor)
        }
    }

    const allPosts = await Post.find({ "author": { "$in": friendIds } })
        .sort({ createdAt: 'desc' })
        .populate({
            path: 'author',
            model: 'User'
        })
        .populate({
            path: 'comments',
            model: 'Comment',
            populate: {
                path: 'author',
                model: 'User'
            }
        })
        .exec(function (err, data) {
            console.log(`Dashboard Wall Page Loaded...`)
            if (err) {
                return console.log(err);
            } else {
                return res.render('socialspread-home', {
                    currentPageTitle: 'YourSpread',
                    data,
                    id,
                    thisUser
                })
            }
        });

});

router.get('/user/:id', ensureAuthenticated, (req, res) => {

    const id = req.user._id;
    const friends = req.user.friends;
    res.render('socialspread-user', {currentPageTitle: 'SocialSpread'})
});


router.get('/photospread', (req, res) => {
    const apiKey = process.env.UNSPLASH_ACCESS_TOKEN
	const options = {
  method: 'GET',
  url: `https://api.unsplash.com/photos/?per_page=100&client_id=${apiKey}`
};

axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    const imageIds = () => {
        for (i=0;i < returnedData.length;i++) {

            const imageId = returnedData[i].id;
            console.log(`Image ID: ${imageId}`)
        }
    }
    res.render('photospread', {returnedData, imageIds});
}).catch(function (error) {
    console.error(error);
});

});

router.get('/photospread/pexels', (req, res) => {
    const client = createClient(process.env.PEXELS_API_KEY);

    const query = 'beach';

    client.photos.search({ query, per_page: 100 }).then(photos => {
        console.log(photos)
        res.render('photospread-pexels', {photos});
    });
});
router.post('/photospread/pexels/search', (req, res) => {
    const query = req.body.search;

    res.redirect(`/socialspread/photospread/pexels/search/${query}`);
});

router.get('/photospread/pexels/search/:query', (req, res) => {
    const client = createClient(process.env.PEXELS_API_KEY);

    const query = req.params.query;

    client.photos.search({ query, per_page: 100 }).then(photos => {
        console.log(photos)
        res.render('photospread-pexels-results', {photos, query})
    });
});



router.get('/photospread/pexels/single/:imageId', (req, res) => {
    const imageId = req.params.imageId;
    const client = createClient(process.env.PEXELS_API_KEY);
    client.photos.show({ id: imageId }).then(photo => {
        console.log(photo);
        res.render('photospread-pexels-single', {photo})
    });
});



/* PIXABAY */

router.get('/photospread/pixabay', (req, res) => {
    const pixabayKey = process.env.PIXABAY_API_KEY;
    const options = {
        method: 'GET',
        url: `https://pixabay.com/api/?key=${pixabayKey}&q=beach`
      };
      
      axios.request(options).then(function (response) {
          const returnedData = response.data;
          console.log(returnedData)
          res.render('photospread-pixabay', {returnedData});
      }).catch(function (error) {
          console.error(error);
      });
});


router.post('/photospread/pixabay/search', (req, res) => {
    const query = req.body.search;
    res.redirect(`/socialspread/photospread/pixabay/photos/${query}`);
});

router.get('/photospread/pixabay/photos/:query', (req, res) => {
    const query = req.params.query;
    const pixabayKey = process.env.PIXABAY_API_KEY;
    const options = {
        method: 'GET',
        url: `https://pixabay.com/api/?key=${pixabayKey}&q=${query}&per_page=100`
      };
      
      axios.request(options).then(function (response) {
          const returnedData = response.data;
          console.log(returnedData)
          res.render('photospread-pixabay-results', {returnedData});
      }).catch(function (error) {
          console.error(error);
      });
});


/* IMGUR */

/* router.get('/photospread/imgur/tags', (req, res) => {
    const imgurId = process.env.IMGUR_CLIENT_ID;
    const imgurSecret = process.env.IMGUR_CLIENT_SECRET;
    const options = {
        method: 'GET',
        'Authorization': `Client-ID ${imgurId}`,
        'X-Mashape-Key': '9aa43ff752795bad54d9364e5e4eacff835bbba7',
        url: `https://api.imgur.com/3/gallery.json`
      };
      
      axios.request(options).then(function (response) {
          const returnedData = response.data;
          console.log(returnedData)
          res.render('photospread-imgur', {returnedData});
      }).catch(function (error) {
          console.error(error);
      });
});


router.post('/photospread/imgur/search', (req, res) => {
    const query = req.body.search;
    res.redirect(`/socialspread/photospread/imgur/photos/${query}`);
});

router.get('/photospread/imgur/photos/:tag', (req, res) => {
    const query = req.params.tag;
    const imgurId = process.env.IMGUR_CLIENT_ID;
    const imgurSecret = process.env.IMGUR_CLIENT_SECRET;
    const options = {
        method: 'GET',
        'Authorization': imgurSecret,
        'X-Mashape-Key': '9aa43ff752795bad54d9364e5e4eacff835bbba7',
        url: `https://api.imgur.com/3/gallery/t/${query}`
      };
      
      axios.request(options).then(function (response) {
          const returnedData = response.data;
          console.log(returnedData)
          res.render('photospread-pixabay-tag-results', {returnedData});
      }).catch(function (error) {
          console.error(error);
      });
});

 */




/* VideoSpread */

router.get('/videospread/pixabay', (req, res) => {
    const pixabayKey = process.env.PIXABAY_API_KEY;
    const options = {
        method: 'GET',
        url: `https://pixabay.com/api/videos/?key=${pixabayKey}&q=future`
      };
      
      axios.request(options).then(function (response) {
          const returnedData = response.data;
          console.log(returnedData)
          res.render('videospread-pixabay', {returnedData});
      }).catch(function (error) {
          console.error(error);
      });
});



router.post('/videospread/pixabay/search', (req, res) => {
    const query = req.body.search;
    res.redirect(`/socialspread/videospread/pixabay/videos/${query}`);
});

router.get('/videospread/pixabay/videos/:query', (req, res) => {
    const query = req.params.query;
    const pixabayKey = process.env.PIXABAY_API_KEY;
    const options = {
        method: 'GET',
        url: `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${query}&per_page=50`
      };
      
      axios.request(options).then(function (response) {
          const returnedData = response.data;
          console.log(returnedData)
          res.render('videospread-pixabay-results', {returnedData});
      }).catch(function (error) {
          console.error(error);
      });
});



router.get('/videospread/pexels/search', (req, res) => {
    res.render('videospread-pexels-search')
});

router.post('/videospread/pexels/search', (req, res) => {
    const query = req.body.search;

    res.redirect(`/socialspread/videospread/pexels/search/${query}`)
});

router.get('/videospread/pexels/search/:term', (req, res) => {
    const query = req.params.term;
    const client = createClient(process.env.PEXELS_API_KEY);
    client.videoes.search({ query, per_page: 1 }).then(videos => {
        console.log(videos);
        res.render('videospread-pexels-results', {videos});
    });
});

router.get('/giphyspread', (req, res) => {
    
    const apiKey = process.env.GIPHY_API_KEY
	const options = {
  method: 'GET',
  url: `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=50&rating=r`
};

axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('giphyspread', {returnedData});
}).catch(function (error) {
	console.error(error);
});

});

router.post('/giphyspread/search', (req, res) => {
    const term = req.body.search;
    res.redirect(`/socialspread/giphyspread/search/${term}`)
})
router.get('/giphyspread/search/:term', (req, res) => {
    const term = req.params.term
    const apiKey = process.env.GIPHY_API_KEY
	const options = {
  method: 'GET',
  url: `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${term}&limit=50&offset=0&rating=r&lang=en`
};

axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('giphyspread-results', {returnedData});
}).catch(function (error) {
	console.error(error);
});
});
module.exports = router;