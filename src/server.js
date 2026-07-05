const app = require('./app');
const env = require('./config/env');
const mailerService = require('./services/mailer.service');

app.listen(env.port, async () => {
  console.log(`Server listening on port ${env.port} [${env.nodeEnv}]`);

  try {
    await mailerService.verifyConnection();
    console.log('SMTP connection verified successfully');
  } catch (err) {
    console.warn(`SMTP connection verification failed: ${err.message}`);
  }
});
