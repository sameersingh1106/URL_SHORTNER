const shortid = require('shortid');
const Url = require('../models/url');

async function generateShortUrl(req, res) {
    const body = req.body;
    if(!body.Url) {
        return res.status(400).json({error: 'Url is required'});
    }

    const shortId = shortid();

    await Url.create({
        shortId: shortId,
        redirectUrl: body.Url,
        visitHistory: [],
    });
    return res.json({id: shortId});
}

async function handleGetAnalytics(req, res) {
    const shortId = req.params.shortId;
    const result = await Url.findOne({ shortId });
    return res.json({visitHistory: result.visitHistory.length, analytics: result.visitHistory});
}

async function handleGetAllUrls(req, res) {
    const urls = await Url.find({}).sort({ createdAt: -1 });
    return res.json(urls);
}

module.exports = {
    handleGenerateNewShortUrl: generateShortUrl,
    handleGetAnalytics,
    handleGetAllUrls,
};
