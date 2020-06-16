const API = require('../utils/api.request');
const api = new API();

module.exports.getAwesomeGags = (req, res) => {
    console.log('method called.');
    const reqOptions1 = {
        uri: 'https://9gag-rss.com/api/rss/get?code=9GAGAwesome&format=2',
        method: 'GET'
    };

    const reqOptions2 = {
        uri: 'https://9gag-rss.com/api/rss/get?code=9GAGFunny&format=2',
        method: 'GET'
    };

    const reqOptions3 = {
        uri: 'https://9gag-rss.com/api/rss/get?code=9GAGHot&format=2',
        method: 'GET'
    }

    const reqOptions4 = {
        uri: 'https://9gag-rss.com/api/rss/get?code=9GAG&format=2',
        method: 'GET'
    }

    let multipleRequests = [];
    let requests = [reqOptions1, reqOptions2, reqOptions3, reqOptions4]

    for (const request of requests) {
        multipleRequests.push(api.sendRequest(request));
    }

    Promise.all(multipleRequests).then((results) => {
        let responseObj = JSON.parse(api.xml2Json(results[0]));
        for (let i = 1; i < results.length; i++) {
            console.log()
            responseObj.rss.channel.item.push(...JSON.parse(api.xml2Json(results[i])).rss.channel.item);
        }

        res.status(200).send(responseObj);
    });
};