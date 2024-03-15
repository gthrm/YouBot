const readline = require('readline');
const aws = require('aws-sdk');
const fs = require('fs').promises;
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger.utils');

require('dotenv').config();

const { SPACE_NAME, SPACE_ENDPOINT, MAX_DURATION } = process.env;

// Set S3 endpoint to DigitalOcean Spaces
const spacesEndpoint = new aws.Endpoint(SPACE_ENDPOINT);
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
});

// 3 hour OR lengthSeconds
function calculateDuration(lengthSeconds) {
  const lengthSecondsNumber = Number(lengthSeconds);
  if (lengthSecondsNumber && MAX_DURATION && lengthSecondsNumber <= Number(MAX_DURATION)) {
    return lengthSecondsNumber;
  }
  return Number(MAX_DURATION);
}

const saveVideoAsMP3 = async (url, userId, next = () => {}) => {
  const videoId = uuidv4();
  const fileName = `${__dirname}/${videoId}.mp3`;
  const key = `${userId}/${videoId}.mp3`;
  const start = Date.now();
  try {
    const info = await ytdl.getInfo(url);
    const stream = ytdl(url, {
      quality: 'highestaudio',
    });
    const duration = calculateDuration(info?.videoDetails.lengthSeconds);
    logger.info(`Duration has been calculated: ${duration} sec.`, duration);

    await new Promise((resolve, reject) => {
      ffmpeg(stream)
        .audioBitrate(128)
        .setDuration(duration)
        .save(fileName)
        .on('progress', (p) => {
          readline.cursorTo(process.stdout, 0);
          const dowloadMessage = `${p.targetSize}kb downloaded; timemark: ${p.timemark}; currentKbps: ${p.currentKbps}`;
          process.stdout.write(dowloadMessage);
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    const fileContent = await fs.readFile(fileName);
    const params = {
      Bucket: SPACE_NAME,
      Key: key,
      Body: fileContent,
      ACL: 'public-read',
    };
    logger.info('\nUpload to space started');
    const data = await s3.putObject(params).promise();
    await fs.unlink(fileName);
    logger.info('\nDownload complete', data);
    logger.info(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
    next({ fileName, key, info });
  } catch (err) {
    logger.error(err);
    try {
      await fs.unlink(fileName);
    } catch (e) {
      logger.error('Error removing file', e);
    }
  }
};

module.exports = {
  saveVideoAsMP3,
};
