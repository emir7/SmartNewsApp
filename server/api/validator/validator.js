const validID = "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj";

module.exports.validate = function (req, res, next) {
    if (req.body.validID === validID) {
        next();
        return;
    }

    return res.status(500).send({
        m: "NOK"
    });
};