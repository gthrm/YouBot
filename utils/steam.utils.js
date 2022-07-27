const readline = require("readline");
const aws = require("aws-sdk");
const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require("uuid");
const { logger } = require('./logger.utils');

require("dotenv").config();

const SPACE_NAME = process.env.SPACE_NAME;
const SPACE_ENDPOINT = process.env.SPACE_ENDPOINT;

// Set S3 endpoint to DigitalOcean Spaces
const spacesEndpoint = new aws.Endpoint(SPACE_ENDPOINT);
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
});



const saveVideoAsMP3 = async (url, userId, next = () => { }) => {
  const videoId = uuidv4();
  const info = await ytdl.getInfo(url);
  logger.info('File info', info);

  const stream = ytdl(url, {
    quality: "highestaudio",
  });
  const fileName = `${__dirname}/${videoId}.mp3`;
  const key = `${userId}/${videoId}.mp3`;
  const start = Date.now();
  // if (info?.videoDetails?.isLive) {
  //   logger.info
  //   return next({ error: "Sorry, this is live stream 🛑" });
  // }

  return ffmpeg(stream)
    .audioBitrate(128)
    .setDuration(10)
    .save(fileName)
    .on("progress", (p) => {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${p.targetSize}kb downloaded`);
      if (p.targetSize > 100) { // 1000000
        logger.info('p', { ...p })
        next({ error: "The file is very long 🛑" });
        return next({ fileName, key, info });

      }
    })
    .on("end", async () => {
      const fileContent = await fs.readFileSync(fileName);
      const params = {
        Bucket: SPACE_NAME,
        Key: key,
        Body: fileContent,
        ACL: "public-read",
      };
      const data = await s3.putObject(params).promise();
      await fs.unlinkSync(fileName);
      logger.info("\nDownload complete", data);
      logger.info(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
      logger.info("Info", info);
      next({ fileName, key, info });
    })
    .on("error", err => logger.error(err));
};

module.exports = {
  saveVideoAsMP3,
};
