const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const mongoose = require('mongoose');
const axios = require('axios');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const User = require('../models/User');



router.get('/tv', async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const tvShow = await Show.find();
    const userShows = await User.findById(userId).select('user_shows');

    const apiKey = process.env.TMDB_API_KEY
    const options = {
        method: 'GET',
        url: `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}`
    };


    axios.request(options).then(function (response) {
        const returnedData = response.data;
        console.log(returnedData)
        res.render('ent-tv-home', { returnedData, user, tvShow, userShows });
    }).catch(function (error) {
        console.error(error);
    });

});



    /* 
    https://api.themoviedb.org/3/tv/popular?api_key=fa70e419db455958299c396522385382
    
    
    // api_key
    fa70e419db455958299c396522385382
    
    
    // RECOMMENDATIONS FOR CURRENT SHOW (The Walking Dead)
    https://api.themoviedb.org/3/tv/1402/recommendations?api_key=fa70e419db455958299c396522385382&language=en-US&page=1
    */
