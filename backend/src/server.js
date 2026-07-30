const app = require('./app');
const env = require('./config/env');
const mailerService = require('./services/mailer.service');
const campaignScheduler = require('./services/campaignScheduler');

app.listen(env.port, async () => {
  console.log(`Server listening on port ${env.port} [${env.nodeEnv}]`);

  try {
    await mailerService.verifyConnection();
    console.log('Resend connection verified successfully');
  } catch (err) {
    console.warn(`Resend connection verification failed: ${err.message}`);
  }

  campaignScheduler.start();
  console.log('Campaign scheduler started');
});
