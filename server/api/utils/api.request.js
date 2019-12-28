const request = require('request');
const parser = require('xml2json');

module.exports = class API {

    sendRequest(options) {
        return new Promise((resolve, reject) => {
            request(options, (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            });
        });
    }

    xml2Json(xml) {
        return parser.toJson(xml);
    }

}