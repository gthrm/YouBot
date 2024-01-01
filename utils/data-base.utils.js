const mongoose = require('mongoose');
const { logger } = require('./logger.utils');

require('../models/feed.model');
require('../models/item.model');
require('dotenv').config();

const Feed = mongoose.model('FeedModel');
const Item = mongoose.model('ItemModel');

const DB_CONFIG = {
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  database: process.env.DATABASE,
  port: process.env.PORT,
};

const MONGOOSE_CONNECT_CONFIG = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

function setUpConnection() {
  mongoose
    .connect(
      `mongodb+srv://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}/${DB_CONFIG.database}`,
      MONGOOSE_CONNECT_CONFIG,
    )
    .then(() => {
      logger.info('Connection to database established');
    })
    .catch((err) => {
      logger.error(`db error ${err.message}`);
    });
}

function createUserFeed({ userId, userName = 'unknown' }) {
  const newFeed = new Feed({
    userId: String(userId),
    title: 'YouBot',
    description: `Personal podcast for ${userName}`,
    createdAt: new Date(),
    feed_url: `rss/${userId}`,
  });
  return newFeed.save();
}

function createFeedItem({
  userId,
  key,
  title = 'unknown',
  description = 'unknown',
  duration,
}) {
  const newItem = new Item({
    userId: String(userId),
    key,
    title,
    description,
    duration,
    createdAt: new Date(),
  });
  return newItem.save();
}

function getFeedItemsListByUserId({ userId }) {
  const condition = {
    userId: String(userId),
  };
  return Item.find(condition).sort({ createdAt: -1 });
}

function getFeedByUserId({ userId }) {
  const condition = {
    userId: String(userId),
  };
  return Feed.findOne(condition).sort({ createdAt: -1 });
}

function getFeed() {
  return Feed.find().sort({ createdAt: -1 });
}

function getFeedItems() {
  return Item.find().sort({ createdAt: -1 });
}

function removeFeedItems() {
  return Item.deleteMany();
}

function removeFeed() {
  return Feed.deleteMany();
}

module.exports = {
  setUpConnection,
  createUserFeed,
  createFeedItem,
  getFeedItemsListByUserId,
  getFeedByUserId,
  getFeed,
  getFeedItems,
  removeFeedItems,
  removeFeed,
};
