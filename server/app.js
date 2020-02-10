const express = require('express');
const logger = require('morgan');

const app = express();
const gagApi = require('./api/routes/gag');
const dataCollectionApi = require('./api/routes/data');
const newsApi = require('./api/routes/news');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(function (_, res, next) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Accept, X-Access-Token'
    );
    next();
});

app.use(logger('dev'));

app.use('/api/gag', gagApi);
app.use('/data', dataCollectionApi);
app.use('/news', newsApi);

app.use(function (_, res, next) {
    res.charset = 'UTF-16'
    next();
});

app.use(function (_, res) {
    res.status(404).send({
        m: 'Not Found',
        s: 404
    });
});

app.use(function (err, req, res, next) {
    console.log(err);
    res.status(404).send({
        m: 'Not Found',
        s: 404
    });
});

app.use(function (_, res, next) {
    res.charset = 'UTF-16';
    next();
});

module.exports = app;