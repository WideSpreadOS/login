const express = require('express');
const router = express.Router();
const {ensureAuthenticated } = require('../config/auth');
const mongoose = require('mongoose');
const axios = require('axios');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const User = require('../models/User');
const UserVideo = require('../models/UserVideo');
const Mux = require('@mux/mux-node');
const { Video } = new Mux(process.env.MUX_TOKEN_ID, process.env.MUX_TOKEN_SECRET);
const upChunk = require('@mux/upchunk');
const { json, send } = require('micro');
const uuid = require('uuid');
const fs = require('fs');
const UserAudio = require('../models/UserAudio');






router.get('/', async (req, res) => {
    const movies = await Movie.find()
    const shows = await Show.find()
    const apiKey = process.env.TMDB_API_KEY
    const options = {
      method: 'GET',
      url: `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}`
    };

    axios.request(options).then(function (response) {
      const returnedData = response.data;
      res.render('ent-home', { returnedData, movies, shows});
    }).catch(function (error) {
      console.error(error);
    });


});




router.get('/movies', async (req, res) => {

    const movies = await Movie.find()
    const comedies = await Movie.find({genre: {$eq: "Comedy"}})
    const action = await Movie.find({genre: {$eq: "Action, Thriller"}})
    const actionSciFi = await Movie.find({genre: {$eq: "Action, Sci-Fi"}})
    const actionAdventure = await Movie.find({genre: {$eq: "Action, Adventure"}})
    const horrorMysteryThriller = await Movie.find({genre: {$eq: "Horror, Mystery, Thriller"}})


    res.render('movies-home', {movies, comedies, action, actionSciFi, actionAdventure, horrorMysteryThriller});
});

router.get('/movies-user', ensureAuthenticated, async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const movieList = user.movie_list; 

    res.render('movies-home-user', {movieList});

});

router.get('/kids/movies', async (req, res) => {
    const movies = await Movie.find({rated: {$eq: "PG"}})
    const gMovies = await Movie.find({rated: {$eq: "G"}})
    const comedies = await Movie.find({rated: {$eq: "PG"}, genre: {$eq: "Comedy"}})



    res.render('movies-home-kids', {movies, gMovies, comedies});
});

router.post('/movies/search', (req, res) => {
    const movieString = req.body.movie;
    const convertedString = movieString.replace(/\s/g, '+')
    res.redirect(`/entertainment/search/movies/${convertedString}`);
});
 
router.get('/search/movies/:query', (req, res) => {
  const query = req.params.query;
  const apiKey = 'd3722e71'
  const options = {
    method: 'GET',
    url: `http://www.omdbapi.com/?apikey=${apiKey}&s=${query}`
  };

  axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('ent-movie-search-results', { returnedData, query });
  }).catch(function (error) {
    console.error(error);
  });
});

router.get('/movies/:movie', (req, res) => {
    const movie = req.params.movie;
    const apiKey = 'd3722e71'
	const options = {
  method: 'GET',
  url: `http://www.omdbapi.com/?apikey=${apiKey}&t=${movie}`
};

axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('ent-movie-info', {returnedData, movie});
  }).catch(function (error) {
    console.error(error);
});
});






router.get('/movies/:movie/vr', async (req, res) => {
  const movie = req.params.movie;
  const apiKey = 'd3722e71'
	const options = {
    method: 'GET',
    url: `http://www.omdbapi.com/?apikey=${apiKey}&t=${movie}`
  };

  axios.request(options).then(function (response) {
      const returnedData = response.data;
      res.render('ent-movie-info-vr', {layout: './layouts/vr-ar', returnedData, movie});
  }).catch(function (error) {
    console.error(error);
  });
});


router.get('/movies/:movie/spreadshield', async (req, res) => {
    const movie = req.params.movie;

    const apiKey = 'd3722e71'
	const options = {
    method: 'GET',
    url: `http://www.omdbapi.com/?apikey=${apiKey}&t=${movie}`
  };

  axios.request(options).then(function (response) {
      const returnedData = response.data;

      res.render('ent-movie-info-spreadshield', {returnedData, movie});
  }).catch(function (error) {
    console.error(error);
  });
});

router.get('/photos/movies/:imdbID', (req, res) => {
  const imdbID = req.params.imdbID;

  var options = {
    method: 'GET',
    url: 'https://imdb8.p.rapidapi.com/title/get-all-images',
    params: { tconst: imdbID },
    headers: {
      'x-rapidapi-host': 'imdb8.p.rapidapi.com',
      'x-rapidapi-key': '7e45ec5e4fmsh4f3dac417f9eaa7p179a33jsnbfe4cb2e4c79'
    }
  };

  axios.request(options).then(function (response) {
    console.log(response.data);
    const returnedData = response.data;
    res.render('ent-movie-info-photos', {returnedData})
  }).catch(function (error) {
    console.error(error);
  });
});

router.post('/movies/save', ensureAuthenticated, async (req, res) => {
    const user = req.user._id;
    const movieLink = req.body.movie_title;
    const movieName = req.body.movie_name;
    const moviePoster = req.body.movie_poster;
    await User.findByIdAndUpdate(user, 
            {$addToSet: {movie_list: {movie_link: movieLink, movie_name: movieName, movie_poster: moviePoster}}},
        )
    res.redirect(`/entertainment/movies/${movieName}`)
});

router.post('/movies/add-to-recommended', ensureAuthenticated, (req, res) => {
    const movieString = req.body.name;
    const convertedString = movieString.replace(/\s/g, '+');
    const movie = new Movie({
        name: movieString,
        link: convertedString,
        poster: req.body.poster,
        genre: req.body.genre,
        rated: req.body.rated
    })
    movie.save()

    res.redirect('/entertainment/movies');

})

router.get('/tv', async (req, res) => {
  const tvShow = await Show.find();
  const apiKey = process.env.TMDB_API_KEY
	const options = {
  method: 'GET',
  url: `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}`
  };

  axios.request(options).then(function (response) {
      const returnedData = response.data;
      res.render('ent-tv-home', {returnedData, tvShow });
  }).catch(function (error) {
    console.error(error);
  });

});

router.get('/tv/user', async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  const tvShow = await Show.find();
  const userShows = await User.findById(userId).select('user_shows');
  console.log(user)
  res.render('ent-tv-user', { user, tvShow, userShows });
});

router.post('/tv/save', ensureAuthenticated, async (req, res) => {
  const user = req.user._id;
  const showLink = req.body.link;
  const showName = req.body.name;
  const showPoster = req.body.poster;
  await User.findByIdAndUpdate(user, 
          {$addToSet: {show_list: {show_link: showLink, show_name: showName, show_poster: showPoster}}},
      )
  res.redirect(`/entertainment/tv/${showLink}`)
});



router.post('/tv/add-to-recommended', ensureAuthenticated, (req, res) => {
  const showString = req.body.name;
  const convertedString = showString.replace(/\s/g, '+');
  const show = new Show({
      name: showString,
      link: req.body.link,
      poster: req.body.poster,
  })
  show.save()
  res.redirect('/entertainment/tv');
});


router.post('/tv/search', (req, res) => {
  const show = req.body.show;
  res.redirect(`/entertainment/tv/search/${show}`);

});


router.get('/tv/search/:show', async (req, res) => {
    const show = req.params.show;
    const apiKey = process.env.TMDB_API_KEY
    const options = {
    method: 'GET',
    url: `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=en-US&page=1&include_adult=false&query=${show}`
  };

  axios.request(options).then(function (response) {
      const returnedData = response.data;
      res.render('ent-tv-search-results', {returnedData, show});
  }).catch(function (error) {
    console.error(error);
  });

});

router.get('/tv/:showId', async (req, res) => {
    const showId = req.params.showId;
    const apiKey = process.env.TMDB_API_KEY
    const options = {
    method: 'GET',
    url: `https://api.themoviedb.org/3/tv/${showId}?api_key=${apiKey}`
  };

  axios.request(options).then(function (response) {
      const returnedData = response.data;
      res.render('ent-tv-show', {returnedData, showId});
  }).catch(function (error) {
    console.error(error);
  });

})

router.get('/tv/:showId/:seasonId', async (req, res) => {
  const showId = req.params.showId;
  const seasonId = req.params.seasonId;
  const apiKey = process.env.TMDB_API_KEY
	const options = {
    method: 'GET',
    url: `https://api.themoviedb.org/3/tv/${showId}/season/${seasonId}?api_key=${apiKey}`
  };

  axios.request(options).then(function (response) {
      const returnedData = response.data;
      console.log(returnedData)
      res.render('ent-tv-show-season', {returnedData, showId});
  }).catch(function (error) {
    console.error(error);
  });

})

router.get('/tv/:showId/:seasonId/:episodeId', async (req, res) => {
  const showId = req.params.showId;
  const seasonId = req.params.seasonId;
  const episodeId = req.params.episodeId;
  const apiKey = process.env.TMDB_API_KEY
	const options = {
    method: 'GET',
    url: `https://api.themoviedb.org/3/tv/${showId}/season/${seasonId}/episode/${episodeId}?api_key=${apiKey}`
  };

  axios.request(options).then(function (response) {
      const returnedData = response.data;
      console.log(returnedData)
      res.render('ent-tv-show-episode', {returnedData, showId});
  }).catch(function (error) {
    console.error(error);
  });
});


router.get('/similar/tv/:showId', async (req, res) => {
  const showId = req.params.showId;
  const apiKey = process.env.TMDB_API_KEY
  const options = {
    method: 'GET',
    url: `https://api.themoviedb.org/3/tv/${showId}/recommendations?api_key=${apiKey}&language=en-US&page=1`
  };

  axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('ent-tv-show-similar', { returnedData, showId });
  }).catch(function (error) {
    console.error(error);
  });
});


/* Videos - User Uploads & Streaming */

router.get('/videos', async (req, res) => {
    const userId = req.user._id;
    const user =  await User.findById(userId);

    res.render('ent-videos', {user});
});

router.get('/videos/:userId', ensureAuthenticated, async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    const userVideo = await UserVideo.find({creator: {$eq: userId}});

    res.render('ent-user-dash', {user, userVideo});
});

router.get('/videos/:userId/upload', ensureAuthenticated, async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    res.render('ent-video-upload', {user});

});

router.post('/videos/upload-it', (req, res) => {
    const user = req.user._id;
    const file = req.body.source;

    Video.Uploads.create({
        cors_origin: 'https://widespread-beta.herokuapp.com', 
        new_asset_settings: {
          playback_policy: 'public'
        }
      }).then(upload => {
        
          // upload.url is what you'll want to return to your client.
          console.log(`Video URL: ${upload}`);
          const playbackId = Video.Assets.create({input: 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4'});

          const userVideo = new UserVideo({
            creator: user,
            title: req.body.title,
            description: req.body.description,
            source: upload.url,
            asset: upload.id,
            playback_id: playbackId
          })
          userVideo.save()

          console.log(`Playback ID: ${playbackId}`)
/*              axios.post(`https://api.mux.com/video/v1/assets`).then(function(response) {
            
          }) */

        res.redirect(`/entertainment/videos/${user}`);
      });
});  

router.get('/videos/:userId/upload-done', async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    const db = await UserVideo.find({creator: {$eq: userId}});
    const { type: eventType, data: eventData } = await json(req);

    switch (eventType) {
      case 'video.asset.created': {
        // This means an Asset was successfully created! We'll get
        // the existing item from the DB first, then update it with the 
        // new Asset details
        const item = await db.get(eventData.passthrough);
        // Just in case the events got here out of order, make sure the
        // asset isn't already set to ready before blindly updating it!
        if (item.asset.status !== 'ready') {
          await db.put(item.id, {
            ...item,
            asset: eventData,
          });
        }
        break;
      };
      case 'video.asset.ready': {
        // This means an Asset was successfully created! This is the final
        // state of an Asset in this stage of its lifecycle, so we don't need
        // to check anything first.
          const item = await db.get(eventData.passthrough);
        await db.put(item.id, { 
          ...item, 
          asset: eventData,
          });
        break;
      };
      case 'video.upload.cancelled': {
        // This fires when you decide you want to cancel an upload, so you
        // may want to update your internal state to reflect that it's no longer
        // active.
        const item = await db.findByUploadId(eventData.passthrough);
        await db.put(item.id, { ...item, status: 'cancelled_upload' });
      }
      default:
        // Mux sends webhooks for *lots* of things, but we'll ignore those for now
        console.log('some other event!', eventType, eventData);
  }  

  res.render('ent-video-upload-complete', {item, eventType, eventData});
});




/* Music */
router.get('/music', (req, res) => {
  const options = {
    method: 'GET',
    url: 'https://deezerdevs-deezer.p.rapidapi.com/search',
    params: {q: 'craig david'},
    headers: {
      'x-rapidapi-key': '7e45ec5e4fmsh4f3dac417f9eaa7p179a33jsnbfe4cb2e4c79',
      'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
    }
  };

  axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData);
    res.render('ent-music-home', {returnedData} );
  }).catch(function (error) {
    console.error(error);
  });
});


router.post('/music/search', (req, res) => {
  const query = req.body.query;
  res.redirect(`/entertainment/music/search/${query}`);
});


router.get('/music/search/:query', (req, res) => {
  const query = req.params.query
  const options = {
    method: 'GET',
    url: 'https://deezerdevs-deezer.p.rapidapi.com/search',
    params: {q: `${query}`},
    headers: {
      'x-rapidapi-key': '7e45ec5e4fmsh4f3dac417f9eaa7p179a33jsnbfe4cb2e4c79',
      'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
    }
  };

  axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData);
    res.render('ent-music-search-results', {returnedData, query} );
  }).catch(function (error) {
    console.error(error);
  });
});


router.get('/music/add', ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  res.render('ent-music-add', {user})
});

router.get('/music/all', async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  const allMusic = await UserAudio.find();
  res.render('ent-music-all', {allMusic, user})
})
router.get('/music/listen', (req, res) => {
  res.render('ent-music-listen')
});
router.get('/music/create', (req, res) => {
  res.render('ent-music-create')
});
/* Podcasts */

router.get('/podcasts', async (req, res) => {


  res.render('ent-podcasts-home', {user});
});


/* Audio Books */

router.get('/news', async (req, res) => {


  res.render('ent-news-home', {user});
});


/* Sports */

router.get('/sports', async (req, res) => {


  res.render('ent-sports-home', {user});
});



module.exports = router;
