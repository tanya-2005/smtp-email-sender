const express = require('express');
const validateSendEmail = require('../middlewares/validateSendEmail');
const { sendEmail } = require('../controllers/email.controller');

const router = express.Router();

router.post('/send', validateSendEmail, sendEmail);

module.exports = router;
