const express = require('express');
const validateWebhookPayload = require('../middlewares/validateWebhookPayload');
const { receiveWebhook, getWebhookLogs } = require('../controllers/webhook.controller');

const router = express.Router();

router.post('/', validateWebhookPayload, receiveWebhook);
router.get('/logs', getWebhookLogs);

module.exports = router;
