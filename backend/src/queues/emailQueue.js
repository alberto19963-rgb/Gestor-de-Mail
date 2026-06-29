const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) 
  : new Redis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });

const emailQueue = new Queue('email-queue', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: 100
  }
});

module.exports = { emailQueue, connection };
