const express = require('express');
const app = express();
const path = require('path');
const HTTP_PORT = process.env.PORT || 8080;
//middleware for css
app.use(express.static(path.join(__dirname, 'assets')));

//handlebars
const exphbs = require('express-handlebars');
app.engine(
  '.hbs',
  exphbs.engine({
    extname: '.hbs',
    helpers: {
      json: (context) => {
        return JSON.stringify(context);
      },
    },
  })
);
app.set('view engine', '.hbs');
app.use(express.urlencoded({ extend: true }));

//DATABASE
const mongoose = require('mongoose');

mongoose.connect(
  'mongodb+srv://dbVnhan1:Vo6E6zle2I9ze4O0@cluster0.feodmn6.mongodb.net/?retryWrites=true&w=majority'
);

const Schema = mongoose.Schema;

// Database schema:

// Videos collection:
const videoSchema = new Schema({
  videoId: String,
  title: String,
  channel: String,
  likes: Number,
  image: String,
  uploadDate: String,
});

const Video = mongoose.model('videos_collection', videoSchema);

// Comments collection
const commentSchema = new Schema({
  username: String,
  text: String,
  videoId: String,
});

const Comment = mongoose.model('comment_collection', commentSchema);

//Video data:
const videoData = [
  {
    videoId: 'ByXuk9QqQkk',
    title: 'Spirited Away - Official Trailer',
    channel: 'Crunchyroll Store Australia',
    likes: 0,
    image: 'https://img.youtube.com/vi/ByXuk9QqQkk/maxresdefault.jpg',
    uploadDate: 'Sep 17, 2014',
  },
  {
    videoId: 'NWvS37wLShE',
    title: 'Modern Desk Setup & Office Tour – Calm, Cozy, Creative',
    channel: 'Matthew Encina',
    likes: 0,
    image: 'https://img.youtube.com/vi/NWvS37wLShE/maxresdefault.jpg',
    uploadDate: 'Dec 28, 2022',
  },
  {
    videoId: 'gBAJm2dX92o',
    title: 'Budget Phones UNDER $300 in 2023 - POCO X5 Pro!',
    channel: 'Justin Tse',
    likes: 0,
    image: 'https://img.youtube.com/vi/gBAJm2dX92o/maxresdefault.jpg',
    uploadDate: 'Feb 16, 2023',
  },
  {
    videoId: 'pDB8a389rdg',
    title:
      'Visiting the Ghibli village in Japan| Yufuin Floral village, Hells of Beppu Oita | Japan travel vlog',
    channel: 'Sol Life',
    likes: 0,
    image: 'https://img.youtube.com/vi/pDB8a389rdg/maxresdefault.jpg',
    uploadDate: 'Dec 8, 2021',
  },
  {
    videoId: 'vyfJgJBB3Vk',
    title: 'Why Singapore Is Insanely Well Designed',
    channel: 'OBF',
    likes: 0,
    image: 'https://img.youtube.com/vi/vyfJgJBB3Vk/maxresdefault.jpg',
    uploadDate: 'Sep 14, 2022',
  },
  {
    videoId: '7zwISb8q1_s',
    title: 'Emergency: NYC | Official Trailer | Netflix',
    channel: 'Netflix',
    likes: 0,
    image: 'https://img.youtube.com/vi/7zwISb8q1_s/maxresdefault.jpg',
    uploadDate: 'Mar 2, 2023',
  },
];

const loadVidData = () => {
  for (let i = 0; i < videoData.length; i++) {
    const video = videoData[i];
    const vidToAdd = new Video({
      videoId: video.videoId,
      title: video.title,
      channel: video.channel,
      likes: video.likes,
      image: video.image,
      uploadDate: video.uploadDate,
    });

    try {
      vidToAdd.save();
      console.log('Video added, check database');
    } catch (err) {
      console.log(err);
    }
  }
};

// ************************************************************************
// LOAD VIDEO DATA:
// Uncomment to run the function below to add videos if the list is empty,
// comment out immediately after running ONCE to avoid duplicates!
// ------------------------
// loadVidData(videoData);
// ------------------------
// *************************************************************************

//HOME PAGE ENDPOINTS
app.get('/', async (req, res) => {
  try {
    const videoList = await Video.find().lean();

    if (videoList.length === 0) {
      // console.log(`[DEBUG] No videos found!`);
      res.render('error', { layout: 'primary', err: 'No videos found!' });
      return;
    }
    // console.log(`[DEBUG] Video list ${videoList}`);
    res.render('home', { layout: 'primary', videos: videoList });
  } catch (err) {
    console.log(err);
  }
});

app.post('/search', async (req, res) => {
  const keyword = req.body.keyword;
  // split each word from entered keyword using split(' ')
  const keywordArr = keyword.split(' ');
  let matchedResults = [];

  try {
  //   const videoFoundList = await Video.find({ title: keyword }).lean();
  //   console.log(videoFoundList);
  //   if (videoFoundList.length === 0) {
  //     res.render('error', {
  //       layout: 'primary',
  //       err: 'No videos found from the database!',
  //     });
  //     return;
  //   } else {
  //     return res.render('home', {
  //       layout: 'primary',
  //       videos: videoFoundList,
  //     });
  //   }

    const videoList = await Video.find().lean();

    if (videoList.length === 0) {
      res.render('error', {
        layout: 'primary',
        err: 'No videos found from the database!',
      });
      return;
    }

    for (let i = 0; i < keywordArr.length; i++) {
      for (let j = 0; j < videoList.length; j++) {
        const title = videoList[j].title.toLowerCase();
        if (title.includes(keywordArr[i].toLowerCase())) {
          matchedResults.push(videoList[j]);
          videoList.splice(j, 1); //remove the selected video to avoid duplicates in search results
        }
      }
    }

    if (matchedResults[0]) {
      return res.render('home', {
        layout: 'primary',
        videos: matchedResults,
      });
    } else {
      return res.render('error', {
        layout: 'primary',
        err: 'No videos found!',
      });
    }
  } catch (err) {
    console.log(err);
  }
});

//VIDEO DETAILS PAGE ENDPOINTS
app.post('/view-details/:id', async (req, res) => {
  // console.log(`[DEBUG] video id ${req.params.id}`);

  try {
    const idFromParams = req.params.id;
    const vidFromDB = await Video.findOne({ videoId: idFromParams }).lean();
    const cmtFromDB = await Comment.find({ videoId: idFromParams }).lean();

    if (vidFromDB === null) {
      res.render('error', { layout: 'primary', err: 'No videos found!' });
      return;
    }
    // console.log(`[DEBUG] video from DB ${vidFromDB}`);
    // console.log(`[DEBUG] comments from DB ${cmtFromDB}`);
    const totalCmts = cmtFromDB.length;

    res.render('view-details', {
      layout: 'primary',
      video: vidFromDB,
      comments: cmtFromDB,
      totalCmts: totalCmts,
    });
  } catch (err) {
    console.log(err);
  }
});

app.post('/like/:id', async (req, res) => {
  // console.log(`[DEBUG] LIKE: video id ${req.params.id}`);

  try {
    const idFromParams = req.params.id;
    const vidFromDB = await Video.findOne({ videoId: idFromParams });
    const cmtFromDB = await Comment.find({ videoId: idFromParams }).lean();

    if (vidFromDB === null) {
      res.render('error', { layout: 'primary', err: 'No videos found!' });
      return;
    }
    vidFromDB.likes += 1;
    await vidFromDB.save();
    const updatedVid = await Video.findOne({ videoId: idFromParams }).lean();

    const totalCmts = cmtFromDB.length;

    res.render('view-details', {
      layout: 'primary',
      video: updatedVid,
      comments: cmtFromDB,
      totalCmts: totalCmts,
    });
    return;
  } catch (err) {
    console.log(err);
  }
});

app.post('/comment/:id', async (req, res) => {
  // console.log(`[DEBUG] COMMENT: video id ${req.params.id}`);
  try {
    const idFromParams = req.params.id;
    const usernameForm = req.body.username;

    const commentForm = req.body.comment;
    // console.log(`[DEBUG] COMMENT: username ${usernameForm}`);
    // console.log(`[DEBUG] COMMENT: comment ${commentForm}`);
    const vidFromDB = await Video.findOne({ videoId: idFromParams }).lean();

    if (vidFromDB === null) {
      res.render('error', { layout: 'primary', err: 'No videos found!' });
      return;
    }

    const cmtToAdd = new Comment({
      username: usernameForm,
      text: commentForm,
      videoId: idFromParams,
    });

    await cmtToAdd.save();
    const cmtFromDB = await Comment.find({ videoId: idFromParams }).lean();

    const totalCmts = cmtFromDB.length;

    res.render('view-details', {
      layout: 'primary',
      video: vidFromDB,
      comments: cmtFromDB,
      totalCmts: totalCmts,
    });
    return;
  } catch (err) {
    console.log(err);
  }
});

//ADMIN PAGE ENDPOINT
app.get('/admin', async (req, res) => {
  const videoList = await Video.find().lean();

  try {
    if (videoList.length === 0) {
      res.render('error', {
        layout: 'primary',
        err: 'You do not have any videos!',
      });
      return;
    }

    //get total comments for each vid
    for (let i = 0; i < videoList.length; i++) {
      const cmtsOfVid = await Comment.find({ videoId: videoList[i].videoId });
      videoList[i].totalComments = cmtsOfVid.length;
    }

    res.render('admin', { layout: 'primary', videos: videoList });
    return;
  } catch (err) {
    console.log(err);
  }
});

app.post('/delete/:id', async (req, res) => {
  try {
    const idFromParams = req.params.id;

    const delResult = await Video.deleteOne({ videoId: idFromParams });
    await Comment.deleteMany({ videoId: idFromParams });

    if (delResult.deletedCount > 0) {
      const videoList = await Video.find().lean();
      for (let i = 0; i < videoList.length; i++) {
        const cmtsOfVid = await Comment.find({ videoId: videoList[i].videoId });
        videoList[i].totalComments = cmtsOfVid.length;
      }
      res.render('admin', { layout: 'primary', videos: videoList });
      return;
    } else {
      res.render('error', { layout: 'primary', err: 'No videos found!' });
      return;
    }
  } catch (err) {
    console.log(err);
  }
});

const HttpOnStart = () => {
  console.log(`Server is starting on port ${HTTP_PORT}...`);
  console.log('Press Ctrl+C to stop running');
};

app.listen(HTTP_PORT, HttpOnStart);
