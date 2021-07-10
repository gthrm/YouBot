const Podcast = require("podcast");

/* lets create an rss feed */
const createFeed = ({ title, description, feed_url }) =>
  new Podcast({
    title,
    description,
    feed_url,
    site_url: "https://rss.cdroma.ru/",
    image_url:
      "https://www.25mbcloud.ml/upload/3145d832b74f2f16f6b823fd312a5d131625916895274.png",
    docs: "http://example.com/rss/docs.html",
    author: "You Bot",
    managingEditor: "You Bot",
    webMaster: "You Bot",
    copyright: `${new Date().getFullYear()} You Bot`,
    language: "en",
    categories: ["Music", "Personal", "People"],
    pubDate: new Date().getUTCDate(),
    ttl: 60,
    itunesAuthor: "You Bot",
    itunesSubtitle: "Be Free",
    itunesSummary: "You Bot - Be Free",
    itunesOwner: { name: "You Bot", email: "max@unsou.de" },
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
      "https://www.25mbcloud.ml/upload/3145d832b74f2f16f6b823fd312a5d131625916895274.png",
  });

const addItemToFeed = (feed, { title, description, url, date, fileUrl, _id }) =>
  /* loop over data and add to feed */
  feed.addItem({
    title, // "item title",
    guid: _id,
    description, // "use this for the content. It can include html.",
    url, // "http://example.com/article4?this&that", // link to the item
    categories: ["People", "Music", "Personal"], // optional - array of item categories
    author: "Guest Author", // optional - defaults to feed author property
    date, // "May 27, 2012", // any format that js Date can parse.
    lat: 33.417974, //optional latitude field for GeoRSS
    long: -111.933231, //optional longitude field for GeoRSS
    enclosure: { url: fileUrl }, // optional enclosure // , file: "path-to-file"
    itunesAuthor: "You Bot",
    itunesExplicit: false,
    itunesSubtitle: "Be Free",
    itunesSummary: "You Bot - Be Free",
    itunesNewFeedUrl: "https://newlocation.com/example.rss",
  });

// cache the xml to send to clients
const getXml = (feed) => feed.buildXml();

module.exports = {
  createFeed,
  addItemToFeed,
  getXml,
};
