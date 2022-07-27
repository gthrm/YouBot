const schedule = require("node-schedule");
const { logger } = require('./logger.utils');

const RECURRENCE_RULE = process.env.RECURRENCE_RULE;
const queue = [];

const jobCallback = () => {
  if (queue.length > 0 && queue[0].started === false) {
    // next will be started when the job will have complied
    const next = () => {
      queue.shift();
    };
    queue[0].started = true;

    queue[0].job(next);
  }
};

const doMainJob = () => {
  logger.info("MainJob started");
  schedule.scheduleJob(RECURRENCE_RULE, jobCallback);
};

module.exports = {
  queue,
  doMainJob,
};
