const express = require('express');
const healthRoutes = require('./health.routes');
const emailRoutes = require('./email.routes');
const settingsRoutes = require('./settings.routes');
const webhookRoutes = require('./webhook.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/emails', emailRoutes);
router.use('/settings', settingsRoutes);
router.use('/webhook', webhookRoutes);

module.exports = router;
