const validID = "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj";
const adminTOKEN = "pawds9ojasodijdaosijasdojdsaoijosdaijadmin109qwei09qweuwqe09uqwe09uqwe09wuqe09qweu09qweu09qweu09sydoinsad";

module.exports.validate = function (req, res, next) {
    if (req.body.validID === validID) {
        next();
        return;
    }

    return res.status(500).send({
        m: "NOK"
    });
};

module.exports.validateRemove = function (req, res, next) {
    if (req.body.adminTOKEN === adminTOKEN && req.body.validID === validID) {
        next();
        return;
    }

    return res.status(500).send({
        m: "NOK"
    });
}