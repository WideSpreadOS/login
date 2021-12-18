const express = require('express');
const router = express.Router();
const {ensureAuthenticated } = require('../config/auth');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const fs = require('fs');
const User = require('../models/User');
const Link = require('../models/Link');
const Post = require('../models/Post');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Comment = require('../models/Comment');
const Resume = require('../models/Resume');
const Article = require('../models/Article');
const ProfileImage = require('../models/ProfileImage');
const PhotoAlbum = require('../models/PhotoAlbum');
const Avatar = require('../models/Avatar');
const Video = require('../models/Video');
const Audio = require('../models/Audio');
const InSpread = require('../models/InSpread');
const Poll = require('../models/Poll');
const axios = require('axios');

// Welcome Page
router.get('/', (req, res) => {
  const currentUser = null
    res.render('welcome', {currentUser });
});

const db = require('../config/keys').MongoURI;
const UserBackgroundImage = require('../models/UserBackgroundImage');
const { response } = require('express');
const UserPhoto = require('../models/UserPhoto');
const conn = mongoose.createConnection(db)
let gfs;
conn.once('open', () => {
    // Init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
  })
  
  //Create storage object
  const storage = new GridFsStorage({
    url: db,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            metadata: {
              imageOwner: req.user._id
            },
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  }); 
  
  const upload = multer({ storage });

  
  // Dashboard
  router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    const id = req.user._id;
    const currentUser = req.user._id;
        
        const friends = req.user.friends;
        const posts = await Post.find({ author: { $eq: id } }).sort({createdAt: 'desc'}).populate(
          {
            path: 'comments',
            model: 'Comment',
            populate: {
              path: 'author',
              model: 'User'
            }
          }
        ).exec();


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
            return returnedData;
          }).catch(function (error) {
            console.error(error);
          }); 

        const resume = await Resume.find({ resumeOwner: { $eq: id } });
        const articles = await Article.find({ author: { $eq: id } });
        const videos = await Video.find({videoOwner: {$eq: id }});
        const userAudio = await User.findById(id).select('user_audio');
        /* console.log(`userAudio: ${userAudio}`); */
        const audioTracks = await Audio.find({audioOwner: {$eq: id }});
        /* console.log(`Audio Tracks: ${audioTracks}`) */
        const profileImages = await ProfileImage.find({ imageOwner: { $eq: id } });
        const avatarImage = await Avatar.findOne({ imageOwner: { $eq: id } });
        const nearbyUsers = await User.find();
        const inSpreads = await InSpread.find({inSpreadTo: {$eq: id}}).sort({inSpreadAt: 'desc'}).populate('inSpreadFrom').exec();
        const backgroundImage = await UserBackgroundImage.findOne({ imageOwner: { $eq: id } });
      const allAvatars = await ProfileImage.find({friends: {$elemMatch: {_id: friends}}})
      const polls = await Poll.find({author: {$eq: id}})
        const questions = await Question.find({author: {$eq: id}}).populate({
          path: 'answers',
          model: 'Answer',
          populate: {
            path: 'author',
            model: 'User'
          }
        }).exec();
        /* console.log(`All Avatars: ${allAvatars}`) */
        const getAvatars = await User.find()

/*         console.log("Users Resume: " + resume)
        console.log("Users Posts: " + posts)
        console.log("Users Posts: " + profileImages) */

        /* console.log(`Friend ID's ${friends}`) */
        friends.forEach(friendId);
        function friendId(value) {
          /* console.log(value) */
          nearbyUsers.forEach(getId)
          function getId(id) {
            /* console.log(id.id) */
          if (value == id.id) {
            /* console.log(`This user is your friend ${value} - ${id.id}`) */
            }
            
          }
        }
        

        User.findById(id)
        .populate({
          path: 'friends',
          model: 'User'
        })
        .populate('posts')
        .then(profile => {
                res.render('dashboard', {
                profile,
                profileImages,
                avatarImage,
                backgroundImage,
                getAvatars,
                allAvatars,
                fname: req.user.fname,
                id: req.user.id,
                posts,
                questions,
                currentUser,
                polls,
                videos,
                audioTracks,
                resume,
                articles,
                nearbyUsers,
                inSpreads,
                weather,
                forecast,
                currentPageTitle: 'Dashboard'
                })

            });
            
    });

    router.get('/dashboard/wall', ensureAuthenticated, async (req, res) => {
      const id = req.user._id;
      const thisUser = await User.findById(id);
      const friendIds = req.user.friends;
      const posts = await Post.find({ "author": { "$in": friendIds } }).sort({createdAt: 'desc'}).populate('comments');
      
      let checkAuthor = []
      const postAuthor = () => {
        for (i = 0; i < posts.length; i++) {
          posts[i].author.push(checkAuthor)
        }}
        
      const allPosts = await Post.find({ "author": { "$in": friendIds } })
      .sort({createdAt: 'desc'})
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
      .exec(function (err, data){
        console.log(`Dashboard Wall Page Loaded...`)
        if(err){
          return console.log(err);
        } else {
          return res.render('dashboard-wall', {
            currentPageTitle: 'YourSpread',
            data,
            id,
            thisUser
          })
        }
      }); 


          
  });

  /* Like Button */
  /* Post Like */
  router.patch('/dashboard/wall/post/:postId/like', ensureAuthenticated, (req, res) => {
    const userId = req.user.id
    const postId = req.params.postId;
    Post.findByIdAndUpdate({_id: postId}, {$inc: {'likes': 1}})
    .exec(
        User.findByIdAndUpdate(userId, 
          {$push: {likedPosts: postId}},
          {safe: true, upsert: true},
          function(err, doc) {
            if(err) {
              console.log(err)
            } else {
              return
            }
          })
    )
    .then(
      res.redirect('/dashboard/wall')
    )
  })


router.patch('/dashboard/wall/post/:postId/save', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const postId = req.params.postId;

  User.findByIdAndUpdate(userId,
    {$addToSet: {saved_posts: postId}},
    {safe: true, upsert: true},
    function(err, doc) {
      if(err) {
        console.log(err)
      } else {
        return
      }
    }
    ).then(
      res.redirect(`/dashboard/wall`)
    )
});
router.patch('/:articleId/save', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.articleId;

  User.findByIdAndUpdate(userId,
    {$addToSet: {saved_articles: articleId}},
    {safe: true, upsert: true},
    function(err, doc) {
      if(err) {
        console.log(err)
      } else {
        return
      }
    }
    ).then(
      res.redirect(`/users/articles/${articleId}`)
    )
});


router.get('/:userId/friends', ensureAuthenticated, async (req, res) => {
    const userId = req.params.userId;

    const friendList = await User.findById(userId).populate({
      path: 'friends',
      model: 'User'
    }).exec()
    res.render('friends-page', {friendList, userId})

});


/* Comment Like */
  router.patch('/:commentId/like', ensureAuthenticated, (req, res) => {
    const userId = req.user.id
    const commentId = req.params.commentId;
    Comment.findByIdAndUpdate({_id: commentId}, {$inc: {'likes': 1}})
    .exec(
        User.findByIdAndUpdate(userId, 
          {$push: {likedComments: commentId}},
          {safe: true, upsert: true},
          function(err, doc) {
            if(err) {
              console.log(err)
            } else {
              return
            }
          })
    )
    .then(
      res.redirect('/dashboard/wall')
    )
  })


  router.get('/dashboard/wall/:postId/comment', ensureAuthenticated, async (req, res) => {
    const postId = req.params.postId;
    const newPostAuthor = req.user._id;
    const friendIds = req.user.friends;
    const friendsData = await User.find({_id: friendIds});
    const post = await Post.findById(postId)
    const comments = await Comment.find({fromPost: {$eq: postId._id} }).populate('author')
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
    
    .exec(function (err, data){
      if(err){
        return console.log(err);
      } else {
        return res.render('dashboard-wall-post', {
          currentPageTitle: 'YourSpread',
          data,
          friendsData,
          post,
          comments,
          newPostAuthor
        })
      }
    }); 

  });

  router.get('/photo-album/:user', ensureAuthenticated, async (req, res) => {
    const user = req.params.user;
    const thisUser = await User.findById(user);
    const photoAlbums = await PhotoAlbum.find({albumnOwner: {$eq: user._id}});
    console.log(photoAlbums)
    res.render('photo-album', {photoAlbums, thisUser})
  })

  router.get('/photo-album/:user/:albumId', ensureAuthenticated, async (req, res) => {
    const userId = req.params.user;
    const albumId = req.params.albumId;
    const photos = await UserPhoto.find({"image_owner": {$eq: userId}})
    const thisUser = await User.findById(userId);
    const photoAlbums = await PhotoAlbum.findById(albumId);
    res.render('album', {photoAlbums, thisUser, albumId, photos})
  });

  router.post('/photo-album', ensureAuthenticated, (req, res) => {
    const user = req.user.id;
    const photoAlbum = new PhotoAlbum({
      albumOwner: req.user._id,
      album_name: req.body.album_name,
      album_description: req.body.album_description,
      album_color: req.body.album_color,
      private: req.body.private,
    });
    photoAlbum.save()

    res.redirect(`/photo-album/${user}`);
  });

router.get('/photo-album/:userId/:albumId/edit', ensureAuthenticated, async (req, res) => {
  const userId = req.params.userId;
  const albumId = req.params.albumId;
  const album = await PhotoAlbum.findById(albumId);
  res.render('photo-album-edit', {album, userId});
});

router.patch('/photo-album/:userId/:albumId/edit', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    const albumId = req.params.albumId;
    const updates = req.body;
    const options = { new: true };
    await PhotoAlbum.findByIdAndUpdate(albumId, updates, options);
    res.redirect(`/photo-album/${userId}/${albumId}`)
  } catch (error) {
    console.log(error);
  }
});

router.delete('/photo-album/:userId/:albumId/delete', ensureAuthenticated, async (req, res) => {
  const userId = req.params.userId;
  const albumId = req.params.albumId;
  await PhotoAlbum.findByIdAndDelete(albumId)
  res.redirect(`/photo-album/${userId}`);
})

  router.get('/polls', ensureAuthenticated, async(req, res) => {
    const allPolls = await Poll.find();

    res.render('all-polls', {allPolls});
  })
 /*  router.get('/socialspread', async (req, res) => {
    const thisUser = req.user._id;
    
    const userFriends = await User.findById(thisUser).populate('friends').exec()
    const friendId = userFriends.friends.map(friend);
    function friend(id) {
      return id._id
    }
    
    let friendIds = []
    friendIds.push(friendId.toString())
    console.log(friendIds)
    const avatars = friendIds.forEach(findAvatar)
    
    
    function findAvatar(friendId) {
      const friendAvatar = ProfileImage.findOne({imageOwner: {$eq: friendId }})
      console.log(friendAvatar)  
    }
    
    User.findById(thisUser)
        .populate({
          path: 'friends',
          model: 'User',
          populate: {
            path: 'friends',
            model: 'User'
          } 
        })
        .exec()
        .then(profile => 
          res.render('socialspread-home', {currentPageTitle: 'SocialSpread', profile, userFriends, friendIds, avatars})
        )
});
 */







module.exports = router;