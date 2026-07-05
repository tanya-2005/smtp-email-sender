const express = require('express');
const upload = require('../middlewares/upload');
const validateSendEmail = require('../middlewares/validateSendEmail');
const { sendEmail } = require('../controllers/email.controller');

const router = express.Router();

router.post('/send', upload.array('attachments', 10), validateSendEmail, sendEmail);

module.exports = router;
