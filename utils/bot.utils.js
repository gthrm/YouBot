const { Telegraf, Markup } = require("telegraf");
const { saveVideoAsMP3 } = require("./steam.utils");
const db = require("./data-base.utils");
const { queue } = require("./queue.utils");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const mask = "https://www.youtube.com/watch?v=";
const mask2 = "https://youtu.be/";

const WELCOME_INFO = {
  key: "welcome/ce9f65bd-acaa-4d16-8fad-fbe63e5d6a37.mp3",
  title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
  description:
    "Rick Astley's official music video for “Never Gonna Give You Up” \n\nSubscribe to the official Rick Astley YouTube channel: https://RickAstley.lnk.to/YTSubID\n\nFollow Rick Astley:\nFacebook: https://RickAstley.lnk.to/FBFollowID \nTwitter: https://RickAstley.lnk.to/TwitterID \nInstagram: https://RickAstley.lnk.to/InstagramID \nWebsite: https://RickAstley.lnk.to/storeID \nTikTok: https://RickAstley.lnk.to/TikTokID\n\nLyrics:\nWe’re no strangers to love\nYou know the rules and so do I\nA full commitment’s what I’m thinking of\nYou wouldn’t get this from any other guy\n\nI just wanna tell you how I’m feeling\nGotta make you understand\n\nNever gonna give you up\nNever gonna let you down\nNever gonna run around and desert you\nNever gonna make you cry\nNever gonna say goodbye\nNever gonna tell a lie and hurt you\n\nWe’ve known each other for so long\nYour heart’s been aching but you’re too shy to say it\nInside we both know what’s been going on\nWe know the game and we’re gonna play it\n\nAnd if you ask me how I’m feeling\nDon’t tell me you’re too blind to see\n\nNever gonna give you up\nNever gonna let you down\nNever gonna run around and desert you\nNever gonna make you cry\nNever gonna say goodbye\nNever gonna tell a lie and hurt you\n\n#RickAstley #NeverGonnaGiveYouUp #OfficialMusicVideo",
};

const validateUrl = (url) => url && (url.includes(mask) || url.includes(mask2));
const replaceUrl = (url) => {
  const tempArray = url.split(" ");
  return tempArray.find((item) => item.includes(mask) || item.includes(mask2));
};

bot.start(async (ctx) => {
  console.log("start ctx", ctx.from);
  const userId = ctx.from.id;
  const personalLink = `${process.env.HOST_NAME}/rss/${userId}`;

  try {
    const userFeed = await db.getFeedByUserId({ userId });
    if (!userFeed?._id) {
      db.createUserFeed({ userId, userName: ctx.from.username });
      db.createFeedItem({ userId, ...WELCOME_INFO });
    }
  } catch (error) {
    console.log("createUserFeed error", error);
    return ctx.reply("Something went wrong 😐");
  }
  ctx.reply(
    `Congratulations, ${ctx.from.username}! 🎉 It's your personal link. Put the link to your podcast app.`
  );
  ctx.telegram
    .sendMessage(ctx.message.chat.id, "`" + personalLink + "`", {
      parse_mode: "MarkdownV2",
    })
    .then(async ({ message_id }) => {
      const keyboard = Markup.inlineKeyboard(
        [
          Markup.button.url(
            "📱 iOS Podcasts",
            "https://podcasters.apple.com/support/828-test-your-podcast"
          ),
          Markup.button.url(
            "🤖 Google Podcasts",
            "https://twitter.com/GabeBender/status/1334593474688126979"
          ),
          ,
          Markup.button.url("📺 Other", "https://transistor.fm/add-podcast/"),
        ],
        { columns: 2 }
      );
      ctx.telegram.pinChatMessage(ctx.message.chat.id, message_id);
      ctx.reply("How to add url to podcast app 👇", keyboard);
    });
  ctx.telegram.sendMessage(
    ctx.message.chat.id,
    "Send me a YouTube link OR share a video from YouTube. Then you can listen to this video as a podcast in your personal podcast."
  );
});

bot.help((ctx) => ctx.reply("Send me the YouTube link 😜"));
bot.on("sticker", (ctx) => ctx.reply("👍"));
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
      const jobId = uuidv4();
      const job = (next = () => {}) =>
        saveVideoAsMP3(replacedUrl, userId, async ({ key, info, error }) => {
          next(jobId); // do next job
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
              `${ctx.message.from.first_name}, the file successfully added to your personal podcast 👍`
            );
          } catch (error) {
            return ctx.reply("Something went wrong 😐");
          }
        });
      queue.push({ id: jobId, job, started: false });
      ctx.reply(
        `${ctx.message.from.first_name}, your position in the queue is ${queue.length}`
      );
    } else {
      ctx.reply(
        `${ctx.message.from.first_name}, YouTube URL not valid! Send valid URL OR share video from YouTube 😕`
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
