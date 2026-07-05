const express = require('express');
const healthRoutes = require('./health.routes');
const emailRoutes = require('./email.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/emails', emailRoutes);

module.exports = router;
