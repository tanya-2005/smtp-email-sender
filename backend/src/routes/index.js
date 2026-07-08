const express = require('express');
const healthRoutes = require('./health.routes');
const emailRoutes = require('./email.routes');
const settingsRoutes = require('./settings.routes');
const webhookRoutes = require('./webhook.routes');
const diagnosticsRoutes = require('./diagnostics.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/emails', emailRoutes);
router.use('/settings', settingsRoutes);
router.use('/webhook', webhookRoutes);
router.use('/diagnostics', diagnosticsRoutes);

module.exports = router;
