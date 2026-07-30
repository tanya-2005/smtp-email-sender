const express = require('express');
const upload = require('../middlewares/upload');
const validateSendEmail = require('../middlewares/validateSendEmail');
const validateBulkSendEmail = require('../middlewares/validateBulkSendEmail');
const validateCsvSendEmail = require('../middlewares/validateCsvSendEmail');
const {
  sendEmail,
  sendBulkEmail,
  sendPersonalizedEmail,
  getSender,
  getCampaignStatus,
  cancelCampaign,
} = require('../controllers/email.controller');

const router = express.Router();

router.get('/sender', getSender);
router.post('/send', upload.array('attachments', 10), validateSendEmail, sendEmail);
router.post('/send-bulk', upload.array('attachments', 10), validateBulkSendEmail, sendBulkEmail);
router.post('/send-personalized', upload.array('attachments', 10), validateCsvSendEmail, sendPersonalizedEmail);
router.get('/campaigns/:id', getCampaignStatus);
router.post('/campaigns/:id/cancel', cancelCampaign);

module.exports = router;
