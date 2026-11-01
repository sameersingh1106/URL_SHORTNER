const express = require('express');
const { handleGenerateNewShortUrl, handleGetAnalytics, handleGetAllUrls } = require('../controllers/url');
const router = express.Router();


router.post('/', handleGenerateNewShortUrl);
router.get('/', handleGetAllUrls);

router.get('/analytics/:shortId', handleGetAnalytics);

module.exports = router;
