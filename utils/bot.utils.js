const { Telegraf } = require("telegraf");
const { saveVideoAsMP3 } = require("./steam.utils");
const db = require("./data-base.utils");

require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const mask = "https://www.youtube.com/watch?v=";
const mask2 = "https://youtu.be/";

const validateUrl = (url) => url && (url.includes(mask) || url.includes(mask2));
const replaceUrl = (url) => {
  const tempArray = url.split(" ");
  return tempArray.find((item) => item.includes(mask) || item.includes(mask2));
};

bot.start(async (ctx) => {
  console.log("start ctx", ctx.from);
  try {
    const userId = ctx.from.id;
    const userFeed = await db.getFeedByUserId({ userId });
    if (!userFeed?._id) {
      db.createUserFeed({ userId, userName: ctx.from.username });
    }
  } catch (error) {
    console.log("createUserFeed error", error);
    return ctx.reply("Something went wrong 😐");
  }
  ctx.reply("Welcome to YouBot! Send me the YouTube link 😜");
});
bot.help((ctx) => ctx.reply("Send me the TouTube link 😜"));
bot.on("sticker", (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hey there"));
bot.on("text", async (ctx) => {
  if (!ctx.message.from.is_bot) {
    const userId = ctx.message.from.id;
    const text = ctx.message.text;
    if (validateUrl(text)) {
      const replacedUrl = replaceUrl(text);
      ctx.telegram.sendMessage(
        ctx.message.chat.id,
        `${ctx.message.from.first_name}, please, wait a minute...`
      );
      saveVideoAsMP3(
        replacedUrl,
        userId,
        async ({ fileName, key, info, error }) => {
          if (error) {
            return ctx.reply(`${ctx.message.from.first_name}, ${error}`);
          }
          try {
            await db.createFeedItem({
              userId,
              key,
              title: info.videoDetails.title,
              description: info.videoDetails.description,
            });
            return ctx.reply(
              `${ctx.message.from.first_name}, the file successfully uploaded`
            );
          } catch (error) {
            return ctx.reply("Something went wrong 😐");
          }
        }
      );
    } else {
      ctx.reply(
        `${ctx.message.from.first_name}, YouTube URL not valid! Send actual URL 😕`
      );
    }
  } else {
    ctx.reply(`${ctx.message.from.first_name}, you fucking bot!`);
  }
});
// bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = {
  bot,
};
