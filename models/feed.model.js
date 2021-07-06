const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FeedSchema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  feed_url: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

mongoose.model("FeedModel", FeedSchema);
