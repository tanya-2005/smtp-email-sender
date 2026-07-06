const express = require('express');
const validateSettings = require('../middlewares/validateSettings');
const { getSettings, saveSettings, testConnection } = require('../controllers/settings.controller');

const router = express.Router();

router.get('/', getSettings);
router.post('/', validateSettings, saveSettings);
router.post('/test', validateSettings, testConnection);

module.exports = router;
