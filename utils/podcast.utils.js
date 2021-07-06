const Podcast = require("podcast");

/* lets create an rss feed */
const createFeed = ({ title, description, feed_url }) =>
  new Podcast({
    title,
    description,
    feed_url,
    site_url: "http://example.com",
    image_url:
      "https://www.25mbcloud.ml/upload/a4975a92de99eb383c743d3407cc631d1625595719028.jpeg",
    docs: "http://example.com/rss/docs.html",
    author: "Dylan Greene",
    managingEditor: "Dylan Greene",
    webMaster: "Dylan Greene",
    copyright: "2013 Dylan Greene",
    language: "en",
    categories: ["Category 1", "Category 2", "Category 3"],
    pubDate: "May 20, 2012 04:00:00 GMT",
    ttl: 60,
    itunesAuthor: "Max Nowack",
    itunesSubtitle: "I am a sub title",
    itunesSummary: "I am a summary",
    itunesOwner: { name: "Max Nowack", email: "max@unsou.de" },
    itunesExplicit: false,
    itunesCategory: [
      {
        text: "Entertainment",
        subcats: [
          {
            text: "Television",
          },
        ],
      },
    ],
    itunesImage:
      "https://www.25mbcloud.ml/upload/a4975a92de99eb383c743d3407cc631d1625595719028.jpeg",
  });

const addItemToFeed = (feed, { title, description, url, date, fileUrl, _id }) =>
  /* loop over data and add to feed */
  feed.addItem({
    title, // "item title",
    guid: _id,
    description, // "use this for the content. It can include html.",
    url, // "http://example.com/article4?this&that", // link to the item
    categories: ["Category 1", "Category 2", "Category 3", "Category 4"], // optional - array of item categories
    author: "Guest Author", // optional - defaults to feed author property
    date, // "May 27, 2012", // any format that js Date can parse.
    lat: 33.417974, //optional latitude field for GeoRSS
    long: -111.933231, //optional longitude field for GeoRSS
    enclosure: { url: fileUrl }, // optional enclosure // , file: "path-to-file"
    itunesAuthor: "Max Nowack",
    itunesExplicit: false,
    itunesSubtitle: "I am a sub title",
    itunesSummary: "I am a summary",
    itunesNewFeedUrl: "https://newlocation.com/example.rss",
  });

// cache the xml to send to clients
const getXml = (feed) => feed.buildXml();

module.exports = {
  createFeed,
  addItemToFeed,
  getXml,
};
