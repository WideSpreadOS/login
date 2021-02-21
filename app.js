const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const User = require('./models/User');
const profileImage = require('./models/ProfileImage');
const video = require('./models/Video');
const avatar = require('./models/Avatar');
const userBackgroundImage = require('./models/UserBackgroundImage');
const PhotoAlbum = require('./models/PhotoAlbum');
const Audio = require('./models/Audio');
const Company = require('./models/Company');
const Subpage = require('./models/Subpage');
const Course = require('./models/Course');
const fs = require('fs');

const { response } = require('express');


const app = express();

require('./config/passport')(passport);
// DB Config
const db = require('./config/keys').MongoURI;

// Connect to MongoDB
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));


// Middleware
app.use(bodyParser.json());
// Static
app.use(express.static('public'));
// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Bodyparser
app.use(express.urlencoded({ extended: false}));

app.use(methodOverride('_method'));

// Express Session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
// Method Override
// Connect Flash
app.use(flash());

// Global Variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

//Init gfs


//Init gfs
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
        const filename = req.user.lname + '-' + req.user.fname + '_' + req.user._id + '_' + buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
}); 

const upload = multer({ storage });


// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/business', require('./routes/businesses'));
app.use('/academy', require('./routes/academy'));
app.use('/tools', require('./routes/tools'));
app.use('/news', require('./routes/news'));
app.use('/shopping', require('./routes/shopping'));
app.use('/socialspread', require('./routes/socialspread'));
app.use('/flexfloor', require('./routes/flexfloor'));
app.use('/spreadshield', require('./routes/spreadshield'));
app.use('/wellness', require('./routes/wellness'));
app.use('/vr-ar', require('./routes/vr-ar'));
app.use('/notebooks', require('./routes/notebooks'));
app.use('/entertainment', require('./routes/entertainment'));
app.use('/leisure', require('./routes/leisure'));
app.use('/yourspread', require('./routes/yourspread'));
app.use('/spreadchat', require('./routes/spreadchat'));

app.post('/upload', upload.single('user_image'), (req, res) => {
  const imageOwner = req.user._id;
  const obj = { 
    imageOwner: req.user._id, 
    img: { 
        data: req.file.filename,
        contentType: 'image/png'
    } 
} 
  profileImage.create(obj, (err, item) => { 
    if (err) { 
        console.log(err); 
    } 
    else { 
        item.save(); 
        console.log(`Image Owner: ${imageOwner} Image Data: ${req.file}`);
        User.findByIdAndUpdate(imageOwner,
          {$push: {user_images: req.file.id}},
          {safe: true, upsert: true},
          function(err, doc) {
              if(err) {
                  console.log(err)
              } else {
                  return
              }
          }
      )
        res.redirect('/dashboard'); 
    } 
}); 
});


/* Background Image Upload */
app.patch('/upload-background-image', upload.single('user_background_image'), (req, res) => {
    const imageOwner = req.user._id;
    const obj = { 
      imageOwner: req.user._id, 
      img: { 
          data: req.file.filename,
          contentType: 'image/png'
      } 
  } 
    userBackgroundImage.create(obj, (err, item) => { 
      if (err) { 
          console.log(err); 
      } 
      else { 
          item.save(); 
          console.log(`Image Owner: ${imageOwner} Image Data: ${obj.img.data}`);
          const newImage = obj.img.data;
          User.findByIdAndUpdate(imageOwner,
            {user_background_image: req.file.filename},
            function(err, doc) {
                if(err) {
                    console.log(err)
                } else {
                    return
                }
            }
        )
          res.redirect(`/users/update-profile/${imageOwner}`); 
      }
})
});

/* Background Image Upload */
app.patch('/upload-vr-background-image', upload.single('user_vr_background_image'), (req, res) => {
    const imageOwner = req.user._id;
    const obj = { 
      imageOwner: req.user._id, 
      img: { 
          data: req.file.filename,
          contentType: 'image/png'
      } 
  } 
    userBackgroundImage.create(obj, (err, item) => { 
      if (err) { 
          console.log(err); 
      } 
      else { 
          item.save(); 
          console.log(`Image Owner: ${imageOwner} Image Data: ${obj.img.data}`);
          const newImage = obj.img.data;
          User.findByIdAndUpdate(imageOwner,
            {user_vr_background_image: req.file.filename},
            function(err, doc) {
                if(err) {
                    console.log(err)
                } else {
                    return
                }
            }
        )
          res.redirect(`/users/update-profile/${imageOwner}`); 
      }
})
});

/* Company Background Image Upload */
app.patch('/upload-company-background-image/:companyId', upload.single('background_image'), (req, res) => {
  const companyId = req.params.companyId;
  const obj = { 
    imageOwner: companyId, 
    img: { 
        data: req.file.filename,
        contentType: 'image/png'
    } 
} 
  userBackgroundImage.create(obj, (err, item) => { 
    if (err) { 
        console.log(err); 
    } 
    else { 
        item.save(); 
        console.log(`Image Owner: ${companyId} Image Data: ${obj.img.data}`);
        const newImage = obj.img.data;
        Company.findByIdAndUpdate(companyId,
          {background_image: req.file.filename},
          function(err, doc) {
              if(err) {
                  console.log(err)
              } else {
                  return
              }
          }
      )
        res.redirect(`/business/${companyId}/manage/public-page`); 
    }
})
});


/* Company Logo Upload */
app.patch('/upload-company-logo/:companyId', upload.single('logo'), (req, res) => {
  const companyId = req.params.companyId;
  const obj = { 
    imageOwner: companyId, 
    img: { 
        data: req.file.filename,
        contentType: 'image/png'
    } 
} 
  userBackgroundImage.create(obj, (err, item) => { 
    if (err) { 
        console.log(err); 
    } 
    else { 
        item.save(); 
        console.log(`Image Owner: ${companyId} Image Data: ${obj.img.data}`);
        const newImage = obj.img.data;
        Company.findByIdAndUpdate(companyId,
          {logo: req.file.filename},
          function(err, doc) {
              if(err) {
                  console.log(err)
              } else {
                  return
              }
          }
      )
        res.redirect(`/business/${companyId}/manage/public-page`); 
    }
})
});


/* Profile Image Upload */
app.patch('/upload-avatar', upload.single('user_profile_image'), (req, res) => {
    const imageOwner = req.user._id;
    const obj = { 
      imageOwner: req.user._id, 
      img: { 
          data: req.file.filename,
          contentType: 'image/png'
      } 
  } 
    userBackgroundImage.create(obj, (err, item) => { 
      if (err) { 
          console.log(err); 
      } 
      else { 
          item.save(); 
          console.log(`Image Owner: ${imageOwner} Image Data: ${obj.img.data}`);
          const newImage = obj.img.data;
          User.findByIdAndUpdate(imageOwner,
            {user_avatar: req.file.filename},
            function(err, doc) {
                if(err) {
                    console.log(err)
                } else {
                    return
                }
            }
        )
          res.redirect(`/dashboard`); 
      }
})
});
/* Photo Album Image Update */
app.post('/upload-to-album/:userId/:albumId', upload.single('photos'), (req, res) => {
    const user = req.user._id;
    const userId = req.params.userId;
    const albumId = req.params.albumId;
    const albumOwner = req.user._id;
    const obj = { 
      albumOwner: req.user._id, 
      img: { 
          data: req.file.filename,
          contentType: 'image/png'
      } 
  } 
    userBackgroundImage.create(obj, (err, item) => { 
      if (err) { 
          console.log(err); 
      } 
      else { 
          item.save(); 
          console.log(`Image Owner: ${albumOwner} Image Data: ${obj.img.data}`);
          const newImage = obj.img.data;
          PhotoAlbum.findByIdAndUpdate(albumId,
            {$addToSet: {photos: req.file.filename}},
            {safe: true, upsert: true},
            function(err, doc) {
                if(err) {
                    console.log(err)
                } else {
                    return
                }
            }
            )
          res.redirect(`/photo-album/${user}`); 
      }
})
});
app.patch('/upload-background-image', upload.single('user_profile_image'), (req, res) => {
    const imageOwner = req.user._id;
    const obj = { 
      imageOwner: req.user._id, 
      img: { 
          data: req.file.filename,
          contentType: 'image/png'
      } 
  } 
    userBackgroundImage.create(obj, (err, item) => { 
      if (err) { 
          console.log(err); 
      } 
      else { 
          item.save(); 
          console.log(`Image Owner: ${imageOwner} Image Data: ${obj.img.data}`);
          const newImage = obj.img.data;
          User.findByIdAndUpdate(imageOwner,
            {user_avatar: req.file.filename},
            function(err, doc) {
                if(err) {
                    console.log(err)
                } else {
                    return
                }
            }
        )
          res.redirect(`/dashboard`); 
      }
})
});


/* Academy Course Background Image */
app.patch('/upload-course-image/:courseId', upload.single('background_image'), (req, res) => {
  const courseId = req.params.courseId;
  const obj = { 
    imageOwner: courseId, 
    img: { 
        data: req.file.filename,
        contentType: 'image/png'
    } 
} 
  userBackgroundImage.create(obj, (err, item) => { 
    if (err) { 
        console.log(err); 
    } 
    else { 
        item.save(); 
        console.log(`Image Owner: ${courseId} Image Data: ${obj.img.data}`);
        const newImage = obj.img.data;
        Course.findByIdAndUpdate(courseId,
          {background_image: req.file.filename},
          function(err, doc) {
              if(err) {
                  console.log(err)
              } else {
                  return
              }
          }
      )
        res.redirect(`/academy/courses/${courseId}`); 
    }
})
});


app.post('/upload-subpage/:subpageId/subpage-upload', upload.single('subpage_image'), (req, res) => {
  const subpageId = req.params.subpageId;
  const companyId = req.body.companyId;
  const obj = { 
    imageOwner: subpageId, 
    img: { 
        data: req.file.filename,
        contentType: 'image/png'
    } 
} 
  userBackgroundImage.create(obj, (err, item) => { 
    if (err) { 
        console.log(err); 
    } 
    else { 
        item.save(); 
        console.log(`Image Owner: ${subpageId} Image Data: ${obj.img.data}`);
        const newImage = obj.img.data;
        Subpage.findByIdAndUpdate(subpageId,
          {$addToSet: {page_images: req.file.filename}},
          {upsert: true, new: true},
          function(err, doc) {
              if(err) {
                  console.log(err)
              } else {
                  return
              }
          }
      )
        res.redirect(`/business/${companyId}/${subpageId}/edit`); 
    }
})
});


/* Video Upload */
app.post('/upload-video', upload.single('user_video'), (req, res) => {
  const videoOwner = req.user._id;
  const uploadedVideo = req.file.user_video;
  
  const obj = { 
    videoOwner: req.user._id, 
    video: { 
        data: req.file.filename,
        contentType: 'video/mp4'
    } 
} 
  video.create(obj, (err, item) => { 
    if (err) { 
        console.log(err); 
    } 
    else { 
        item.save(); 
        console.log(`Video Owner: ${videoOwner} Video Data: ${obj.video.data}`);
        User.findByIdAndUpdate(videoOwner,
          {$push: {user_video: req.file.id}},
          {safe: true, upsert: true},
          function(err, doc) {
              if(err) {
                  console.log(err)
              } else {
                  return
              }
          }
      )
        res.redirect('/dashboard'); 
    } 
}); 
});

app.post('/upload-audio', upload.single('user_audio'), async (req, res) => {
const audioOwnerId = req.user._id;

const obj = { 
  audioOwner: audioOwnerId, 
  audio_name: req.body.audio_name,
  audio: { 
      data: req.file.filename,
      contentType: 'audio/mp3'
  } 
} 
Audio.create(obj, (err, item) => { 
  if (err) { 
      console.log(err); 
  } 
  else { 
      item.save(); 
      console.log(`Audio Owner: ${audioOwnerId} Audio Data: ${obj.audio.data}`);
      User.findByIdAndUpdate(audioOwnerId,
        {$push: {user_audio: req.file.filename}},
        {safe: true, upsert: true},
        function(err, doc) {
            if(err) {
                console.log(err)
            } else {
                return
            }
        }
    )
      res.redirect('/dashboard'); 
  } 
}); 
}); 

app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if Files
    if(!files || files.lenth === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    } 

    // Files do exist
    console.log(files)
    return res.render('all-images', {files})
  })
})

app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // Check if Files
        if(!file || file.lenth === 0) {
          return res.status(404).json({
            err: 'That file does not exist'
          });
        }
    
        // Files do exist
        return res.render('single-image-file', {file})
  })
})

app.get('/audio/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // Check if Files
        if(!file || file.lenth === 0) {
          return res.status(404).json({
            err: 'That file does not exist'
          });
        }
            // Files do exist
            if(file.contentType === 'audio/mpeg' || file.contentType === 'audio/ogg') {
              // Read the output to the stream
              const readstream = gfs.createReadStream(file.filename);
              readstream.pipe(res);
            } else {
              res.status(404).json({
                err: 'Not an audio file'
              })
            }
        // Files do exist
        return res.render('single-audio-file', {file})
  })
})
app.delete('/delete-image/:fileId', (req,res) => {
  const fileId = req.params.fileId;
  console.log(`File ID being deleted: ${fileId}`);
  gfs.remove({_id: fileId, root: 'uploads'}, (err, gridStore) => {
    if(err) {
      return res.status(404).json({err: err});
    } else {
      res.redirect('/files')
    }
});


})
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // Check if Files
        if(!file || file.lenth === 0) {
          return res.status(404).json({
            err: 'That file does not exist'
          });
        }
    
        // Files do exist
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
          // Read the output to the stream
          const readstream = gfs.createReadStream(file.filename);
          readstream.pipe(res);
        } else {
          res.status(404).json({
            err: 'Not an image'
          })
        }
  })
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on ${PORT}`));