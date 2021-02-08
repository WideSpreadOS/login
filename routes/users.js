const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const mongoose = require('mongoose');
const {ensureAuthenticated } = require('../config/auth');

const bodyParser = require('body-parser');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

// User Model
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Resume = require('../models/Resume');
const Company = require('../models/Company');
const Article = require('../models/Article');
const ProfileImage = require('../models/ProfileImage');
const CommentImage = require('../models/CommentImage');
const Avatar = require('../models/Avatar');
const InSpread = require('../models/InSpread');
const Question = require('../models/Question');

// Login Page
router.get('/login', (req, res) => {
    res.render('login', {currentPageTitle: 'Login', fname: ''});
})
// Register Page
router.get('/register', (req, res) => {
    res.render('register', {currentPageTitle: 'Register'});
})

// Register Handle
router.post('/register', (req, res) => {
    const {fname, lname, email, password, password2 } = req.body;
    let errors = [];

    // Check required fields
    if(!fname || !lname || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields'})
    }
    // Check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match'})
    }

    // Check password length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters'})
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            fname,
            lname,
            email,
            password,
            password2
        });
    } else {
        // Validation Pass
        User.findOne({ email: email })
        .then(user => {
            if (user) {
                // User Exists
                errors.push({ msg: 'Email is already registered'})
                res.render('register', {
                    errors,
                    fname,
                    lname,
                    email,
                    password,
                    password2
                });
            } else {
                const newUser = new User({
                    fname,
                    lname,
                    email,
                    password
                });
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err;
                    // Set password to hashed
                    newUser.password = hash;
                    // Save user
                    newUser.save()
                        .then(user => {
                            req.flash('success_msg', 'You are now registered and can log in');
                            res.render('login', {currentPageTitle: 'Login'});
                        })
                        .catch(err => console.log(err));

                }))
            }
        })
        .catch();
    }
})


// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login')
});

// User Profile Page
  
router.get('/:id', ensureAuthenticated, async (req, res) => {
    const id = req.params.id
    const userId = req.user._id;
    console.log("User ID: " + userId);
    const inSpreads = await InSpread.find({inSpreadTo: {$eq: id}}).populate('inSpreadFrom').exec();
    console.log(`InSpreads: ${inSpreads}`)
    const articles = await Article.find({author: {$eq: id}});
   const posts = await Post.find({ author: { $eq: id } }).sort({createdAt: 'desc'}).populate(
       {
        path: 'comments',
        model: 'Comment',
        populate: {
            path: 'author',
            model: 'User'
  }}
   ).exec();
   const profileImages = await ProfileImage.find({ imageOwner: { $eq: id } });
   const avatarImage = await Avatar.findOne({ imageOwner: { $eq: id } });
   console.log(`Current Profile Avatar: ${avatarImage}`)
    User.findById(id)
    .populate('friends')
    .populate('user_images')
    .exec()
    .then(profile => {
            res.render('public-profile', {currentPageTitle: "Profile", profile, posts, articles, profileImages, avatarImage, userId, inSpreads})
            console.log(profile);
        });
})

router.post('/:profileId/inspread/:spreaderId', ensureAuthenticated, async (req, res) => {
    const spreadTo = req.params.profileId;
    const spreadFrom = req.params.spreaderId;

    const inSpread = new InSpread({
        inSpreadFrom: spreadFrom,
        inSpreadTo: spreadTo,
        inSpreadBody: req.body.inSpreadBody,
        private: req.body.private
    })
    inSpread.save();
    await User.findByIdAndUpdate(spreadTo,
        {$addToSet: {inSpreads: inSpread._id}},
        {safe: true, upsert: true},
        function(err, doc) {
            if(err) {
                console.log(err)
            } else {
                return
            }
        }
        )
    res.redirect(`/users/${spreadTo}`);
})

  router.post('/:id/add-friend', (req, res) => {
    let id = req.body.friends;
    let userId = req.user._id;
    console.log("req.body: " + id);
    User.findOne({'_id': req.body.friends}, '_id', (err, newFriend) => {
        console.log("newFriend ID - Step 1: " + newFriend._id);
        console.log("currentUser ID - Step 2: " + userId);
        if (err) {
            return
        } else {
            User.findByIdAndUpdate(userId,
                {$push: {friends: req.body.friends}},
                {safe: true, upsert: true},
                function(err, doc) {
                    if(err){
                    console.log(err);
                    }else{
                    
                        return
                    }
                }
                )
                
            }
    })
    .then(
        res.redirect('/dashboard')
    )

});
  router.patch('/:id/remove-friend', (req, res) => {
    let id = req.body.friends;
    let userId = req.user._id;
    console.log("req.body: " + id);
    User.findOne({'_id': req.body.friends}, '_id', (err, newFriend) => {
        console.log("newFriend ID - Step 1: " + newFriend._id);
        console.log("currentUser ID - Step 2: " + userId);
        if (err) {
            return
        } else {
            User.findByIdAndUpdate(userId,
                {$pull: {friends: req.body.friends}},
                function(err, doc) {
                    if(err){
                    console.log(err);
                    }else{
                    
                        return
                    }
                }
                )
                
            }
    })
    .then(
        res.redirect('/dashboard')
    )

});

router.get('/update-profile/:id', ensureAuthenticated, async (req, res, next) => {
    const id = req.user._id
    const currentUser = await User.findById(id);

    console.log(`Current user to update: ${id} - ${currentUser.fname}`)

    res.render('update-profile', {currentPageTitle: 'Update Your Profile', id: id, currentUser});
});


router.patch('/update-profile', ensureAuthenticated, async (req, res, next) => {
    try {
    const id = req.user._id;
    const updates = req.body;
    const options = {new: true};
    await User.findByIdAndUpdate(id, updates, options);

    res.redirect('/dashboard');


} catch (error) {
    console.log(error);
}

});

router.get('/new-resume/:userId', ensureAuthenticated, async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findById(userId)
    User.findById(userId)
    console.log(`This Userrrrrr: ${user}`)
    res.render('new-resume', {currentPageTitle: 'New Resume', user})
})
router.post('/new-resume', ensureAuthenticated, async (req, res) => {
    const userId = req.user._id;
            
            const resume = new Resume({
                resumeOwner: userId,
                resume_name: req.body.resume_name,
                bio: req.body.bio,
                objective: req.body.objective,
                "education.school": req.body.educationSchool,
                "education.graduated": req.body.educationGraduate,
                "education.major": req.body.educationMajor,
                "education.gpa": req.body.educationGpa,
                "employment_history.company": req.body.employment_historyCompany,
                "employment_history.position": req.body.employment_historyPosition,
                "employment_history.year_start": req.body.employment_historyYearStart,
                "employment_history.year_end": req.body.employment_historyYearEnd,
                "employment_history.reference.fname": req.body.employment_historyReferenceFname,
                "employment_history.reference.lname": req.body.employment_historyReferenceLname,
                "employment_history.reference.email": req.body.employment_historyReferenceEmail,
                "employment_history.reference.phone": req.body.employment_historyReferencePhone,
                volunteer_work: req.body.volunteer_work,
                hobbies_interests: req.body.hobbies_interests,
                special_skill1: req.body.special_skill1,
                special_skill2: req.body.special_skill2,
                special_skill3: req.body.special_skill3,
                special_skill4: req.body.special_skill4,
                special_skill5: req.body.special_skill5,
                us_veteran: req.body.us_veteran,
                security_clearance: req.body.security_clearance,
                willing_to_travel: req.body.willing_to_travel,
                willing_to_relocate: req.body.willing_to_relocate
            })
            
            
            await User.findByIdAndUpdate(userId,
                {$push: {resume: resume._id}},
                {safe: true, upsert: true},
                function(err, doc) {
                    if(err){
                        console.log(err);
                    }else{
                        resume.save()
                        return
                    }
                }
                )
            res.redirect('/business/your-desk');
        })
        router.get('/add-to-resume/education/:resumeId', ensureAuthenticated, async (req, res) => {
            const user = req.user._id;
            const resumeId = req.params.resumeId;
            const resume = Resume.findById(resumeId);
            res.render('new-resume-add-to-education', {resume})
        })
        router.patch('/add-to-resume/:resumeId', ensureAuthenticated, async (req, res) => {

        })
        router.patch('/update-resume/:resumeId', ensureAuthenticated, async (req, res, next) => {
            try {
                const resumeOwner  = req.user._id;
                const updates = req.body;
                const options = {new: true};
                await Resume.findByIdAndUpdate(resumeOwner, updates, options);
                
                res.redirect('/dashboard');
                
                
            } catch (error) {
                console.log(error);
            }
        

});

router.get('/update-resume/:resumeId', ensureAuthenticated, async (req, res, next) => {
    const resumeId = req.params.resumeId;
    const resume = await Resume.find(resumeId);
    const currentUser = req.user;
    Resume.find(resumeId)
    console.log(`Current user to update: ${resumeId} - ${resume}`)

    res.render('update-resume', {currentPageTitle: 'Update Your Resume', id: id, currentUser, resume});
});
router.get('/resumes', ensureAuthenticated, async (req, res) => {
    const userId = req.user._id;
    const resume = await Resume.find({resumeOwner: {$eq: userId}})
    Resume.find({resumeOwner: {$eq: userId}})
    console.log(`Resumes: ${resume}`)
    res.render('resumes', {currentPageTitle: 'Your Resumes', resume})
})

router.get('/resume/:resumeId', ensureAuthenticated, async (req, res) => {
    const resumeId = req.params.resumeId;
    const resume = await Resume.findById(resumeId);
    const userId = await User.findOne({'resume': resumeId }, '_id');
    console.log(`UserId of resume: ${userId}`)
    const hiringId = await Company.findOne({'job_applicants': userId});
    Resume.findById(resumeId);

    res.render('resume', {currentPageTitle: 'Resume', resume, hiringId})
})


router.post('/:id/post', ensureAuthenticated, (req, res) => {
    const userId = req.user._id;
    const post = new Post({
        _id: req.body._id,
        postBody: req.body.postBody,
        createdAt: req.body.createdAt,
        author: userId
    })
    post.save()
    res.redirect('/dashboard/wall')

});


// Seeing Posts

router.get('/posts/:postId', ensureAuthenticated, async (req, res) => {
      const postId = req.params.postId;

        
      const thisPost = await Post.findById(postId)
      console.log("Post ID: " + postId);
      console.log("postId Data: " + thisPost.author);

    const userPost =
    {
        id: req.params.postId,
        author: req.body.author,
        postBody: req.body.postBody,
        createdAt: req.body.createdAt,
        comments: req.body.comments
    }

    const postAuthor = await User.findById(thisPost.author)
        console.log("POST AUTHOR: " + postAuthor.fname)
        
        res.render('full-post', {thisPost, postAuthor, currentPageTitle: thisPost.author + "'s Post"})
})



// See Post
router.get('/post/:postId', (req, res) => {
    const post = {
        id: req.params.postId,
        postBody: req.params.postBody
    }
    const id = req.user.id;
    res.render('delete-post', {post, id})
})
// Editing Posts
router.get('/post/edit/:postId', ensureAuthenticated, async (req, res) => {
    const postId = req.params.postId;
    const thisPost = await Post.findById(postId);

    const id = req.user.id;
    res.render('edit-post', {thisPost})
})

router.patch('/post/edit/:postId', async (req, res) => {
    try {
    const post = req.params.postId;
    const updates = req.body;
    const options = {new: true};
    await Post.findByIdAndUpdate(post, updates, options);
    res.redirect('/dashboard/wall')
} catch (error) {
    console.log(error);
}

});
// Deleting Posts
router.delete('/post/:postId', async (req, res) => {
    const post = req.params.postId;

    await Post.findByIdAndDelete(post);
    res.redirect('/dashboard')

});

router.post('/:id/post/:postId/comment', ensureAuthenticated, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user._id;

    const comment = new Comment({
        commentBody: req.body.commentBody,
        fromPost: postId,
        author: userId,
    })
    
    await Post.findByIdAndUpdate(postId, 
        {$addToSet: {comments: comment._id}},
        {safe: true, upsert: true},
        function(err, doc) {
            if(err) {
                console.log(err);
            } else {
                comment.save()
                return
            }
        }
        )
    res.redirect('/dashboard/wall')

});

/* router.post('/:id/post/:postId/image', ensureAuthenticated, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user._id;
    const id = req.params.id;

    CommentImage.findByIdAndUpdate(postId,
        {$push: {fromPost: req.file.id}},
        {safe: true, upsert: true},
        function(err, doc) {
            if(err) {
                console.log(err)
            } else {
                return
            }
        }
        )
        .exec(
            res.redirect('/dashboard/wall')
        )
}); */

router.post('/:id/article', ensureAuthenticated, (req, res) => {
    const userId = req.user._id;
    const article = new Article({
        _id: req.body._id,
        articleTitle: req.body.articleTitle,
        articleHeader: req.body.articleHeader,
        articleBody: req.body.articleBody,
        createdAt: req.body.createdAt,
        author: userId
    })
    article.save()
    res.redirect('/dashboard')

});

router.get('/articles/:articleId', ensureAuthenticated, async (req, res) => {
    const articleId = req.params.articleId;
    const thisUser = req.user._id;
      
    const thisArticle = await Article.findById(articleId)
    console.log("Post ID: " + articleId);
    console.log("postId Data: " + thisArticle.author);

  const userArticle =
  {
      id: req.params.postId,
      author: req.body.author,
      articleTitle: req.body.articleTitle,
      articleHeader: req.body.articleHeader,
      articleBody: req.body.articleBody,
      createdAt: req.body.createdAt,
      comments: req.body.comments
  }

  const articleAuthor = await User.findById(thisArticle.author)
      console.log("POST AUTHOR: " + articleAuthor.fname)
      
      res.render('full-article', {thisArticle, articleAuthor, thisUser, currentPageTitle: "An Article by:  " + articleAuthor.fname + " " + articleAuthor.lname})
})


// MUST BE AT BOTTOM BEFORE MODULE.EXPORTS
let gfs;


module.exports = router;