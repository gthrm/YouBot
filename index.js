const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const db = require('./utils/data-base.utils');
const podcast = require('./utils/podcast.utils');
const { bot } = require('./utils/bot.utils');
const { corsCheck } = require('./utils/cors.utils');
const { doMainJob } = require('./utils/queue.utils');
const { logger } = require('./utils/logger.utils');

require('dotenv').config();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 429,
      message: 'Too many requests from your IP. Please wait 15 Minutes',
    },
  },
});

const app = express();

const corsOptions = {
  origin: corsCheck,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://*'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use(limiter);
app.use(helmet(helmetConfig));
app.use('/', express.static(path.join(__dirname, './public')));

app.get('/rss/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const feedData = await db.getFeedByUserId({ userId });
    const feedItemsData = await db.getFeedItemsListByUserId({ userId });
    if (feedData) {
      const { title, description, feed_url: localUrl } = feedData;
      const feed_url = `${process.env.HOST_NAME}/${localUrl}`;
      const feed = podcast.createFeed({
        title,
        description,
        feed_url,
      });
      logger.info('Empty feed', feed);
      feedItemsData.forEach((feedItem) => podcast.addItemToFeed(feed, {
        _id: `${feedItem._id}`,
        title: feedItem.title,
        description: feedItem.description,
        url: `${process.env.HOST_NAME}/${localUrl}`,
        date: feedItem.createdAt,
        fileUrl: `https://${process.env.SPACE_NAME}.${process.env.SPACE_ENDPOINT}/${feedItem.key}`,
      }));
      logger.info('Not empty feed', feed);
      const xmlFeed = await podcast.getXml(feed);
      res.set('Content-Type', 'application/rss+xml');
      return res.send(xmlFeed);
    }
    res.status(404);
    return res.send({ feedData, feedItemsData });
  } catch (error) {
    return res.send(error);
  }
});

// app.get("/testerfeed", (req, res) => {
//   db.getFeed()
//     .then((data) => res.send(data))
//     .catch((err) => res.send(err));
// });
// app.get("/testeritems", (req, res) => {
//   db.getFeedItems()
//     .then((data) => res.send(data))
//     .catch((err) => res.send(err));
// });
// app.get("/testdelfeed", (req, res) => {
//   db.removeFeed()
//     .then((data) => res.send(data))
//     .catch((err) => res.send(err));
// });
// app.get("/testdelitems", (req, res) => {
//   db.removeFeedItems()
//     .then((data) => res.send(data))
//     .catch((err) => res.send(err));
// });

http.createServer(app).listen(process.env.SERVER_PORT, () => {
  logger.info(
    `Express server listening on port ${process.env.SERVER_PORT}. chrome://inspect`,
  );
  try {
    bot.launch();
    db.setUpConnection();
    doMainJob();
  } catch (error) {
    logger.error(new Error(error));
  }
});
