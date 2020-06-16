const validID = "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj";

module.exports.validate = function (req, res, next) {
    if (req.body.validID === validID) {
        next();
        return;
    }
    console.log('RETURNING NOK   0');
    return res.status(500).send({
        m: "NOK"
    });
};