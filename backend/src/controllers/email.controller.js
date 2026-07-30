const mailerService = require('../services/mailer.service');
const settingsService = require('../services/settings.service');
const campaignService = require('../services/campaign.service');
const AppError = require('../utils/AppError');

function buildAttachments(files) {
  return (files || []).map((file) => ({
    filename: file.originalname,
    content: file.buffer,
    contentType: file.mimetype,
  }));
}

async function sendEmail(req, res, next) {
  const { to, subject, text, html } = req.body;
  const attachments = buildAttachments(req.files);

  try {
    const info = await mailerService.sendMail({ to, subject, text, html, attachments });
    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (err) {
    next(err);
  }
}

// Bulk/personalized sends now create a drip campaign and return immediately instead of
// blocking on the network calls - mailerService.assertConfigured() reproduces the same
// upfront "Sender Account not configured" 503 the old synchronous path gave, so that failure
// still surfaces instantly rather than only showing up once the scheduler tries to send.
function sendCampaign(type) {
  return async function (req, res, next) {
    const { recipients, subject, text, html } = req.body;
    const attachments = buildAttachments(req.files);

    try {
      mailerService.assertConfigured();
      const campaign = campaignService.createCampaign({ type, recipients, subject, text, html, attachments });
      res.status(202).json(campaignService.getCampaignSummary(campaign));
    } catch (err) {
      next(err);
    }
  };
}

const sendBulkEmail = sendCampaign('bulk');
const sendPersonalizedEmail = sendCampaign('personalized');

// Polled by the frontend every 10-15s to track a drip campaign's progress.
function getCampaignStatus(req, res, next) {
  const campaign = campaignService.getCampaign(req.params.id);
  if (!campaign) return next(new AppError('Campaign not found', 404));

  res.status(200).json(campaignService.getCampaignSummary(campaign));
}

function cancelCampaign(req, res, next) {
  const campaign = campaignService.getCampaign(req.params.id);
  if (!campaign) return next(new AppError('Campaign not found', 404));

  if (!campaignService.isCancellable(campaign)) {
    return next(new AppError(`Campaign cannot be cancelled - it is already ${campaign.status}`, 409));
  }

  const cancelled = campaignService.cancelCampaign(campaign);
  res.status(200).json(campaignService.getCampaignSummary(cancelled));
}

function getSender(req, res) {
  const settings = settingsService.readSettings();
  res.status(200).json({
    email: settings.senderEmail || null,
    configured: settingsService.isConfigured(settings),
  });
}

module.exports = { sendEmail, sendBulkEmail, sendPersonalizedEmail, getSender, getCampaignStatus, cancelCampaign };
