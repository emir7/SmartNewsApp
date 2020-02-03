const express = require('express')
const router = express.Router()
const CacheNews = require('../newsCache/cache');
const cacheNews = new CacheNews();

router.get('/home', (_, res) => {
    const news = cacheNews.getNews('top-headlines');
    res.status(200).send(news);
});

router.get('/entertainment', (_, res) => {
    const news = cacheNews.getNews('entertainment');
    res.status(200).send(news);
});

router.get('/sports', (_, res) => {
    const news = cacheNews.getNews('sports');
    res.status(200).send(news);
});

module.exports = router;