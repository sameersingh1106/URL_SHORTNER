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

module.exports = {
    handleGenerateNewShortUrl: generateShortUrl ,
};