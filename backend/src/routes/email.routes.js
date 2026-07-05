const express = require('express');
const upload = require('../middlewares/upload');
const validateSendEmail = require('../middlewares/validateSendEmail');
const validateBulkSendEmail = require('../middlewares/validateBulkSendEmail');
const { sendEmail, sendBulkEmail } = require('../controllers/email.controller');

const router = express.Router();

router.post('/send', upload.array('attachments', 10), validateSendEmail, sendEmail);
router.post('/send-bulk', upload.array('attachments', 10), validateBulkSendEmail, sendBulkEmail);

module.exports = router;
