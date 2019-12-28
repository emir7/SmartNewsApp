const API = require('../utils/api.request');
const api = new API();

module.exports.getAwesomeGags = (req, res) => {
    console.log('method called.');
    const options = {
        uri: 'https://9gag-rss.com/api/rss/get?code=9GAG&format=2',
        method: 'GET'
    };

    api.sendRequest(options)
        .then(gagData => {
            console.log(JSON.stringify(api.xml2Json(gagData)));
            res.status(200).send(api.xml2Json(gagData));
        }).catch(err => {
            console.log("======================")
            console.log(err);
        });
};