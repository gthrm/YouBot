const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  userId: { type: String, required: true },
  createdAt: { type: Date, required: true },
  key: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

mongoose.model("ItemModel", ItemSchema);
