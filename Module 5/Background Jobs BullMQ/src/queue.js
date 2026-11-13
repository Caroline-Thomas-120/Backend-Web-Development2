'use strict';

const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
};

const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

module.exports = { emailQueue, connection };
