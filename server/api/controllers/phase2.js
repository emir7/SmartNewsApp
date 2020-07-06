const mongoose = require('mongoose')

const PhaseTwo = mongoose.model("PhaseTwo");
const User = mongoose.model("User");

function createPhaseTwoInstance(phaseTwoObj) {
    let phaseTwoInstance = new PhaseTwo();

    phaseTwoInstance.algorithm = phaseTwoObj.algorithm;
    phaseTwoInstance.userActivity = phaseTwoObj.userActivity;
    phaseTwoInstance.environmentBrightness = phaseTwoObj.environmentBrightness;
    phaseTwoInstance.theme = phaseTwoObj.theme;
    phaseTwoInstance.layout = phaseTwoObj.layout;
    phaseTwoInstance.fontSize = phaseTwoObj.fontSize;
    phaseTwoInstance.predictionProbability = phaseTwoObj.predictionProbability;
    phaseTwoInstance.output = phaseTwoObj.output;

    return phaseTwoInstance.save()
        .then(() => {
            return phaseTwoInstance._id;
        });
}

module.exports.writeData = (req, res) => {

    if (req.body.username == null) {
        console.log("Username is required!");
        return res.status(500).send({ m: "nok" });
    }

    if (req.body.phaseTwo == null) {
        console.log("PhaseTwo object is missing!");
        return res.status(500).send({ m: "nok" });
    }

    if (req.body.phaseTwo.algorithm == null ||
        req.body.phaseTwo.userActivity == null ||
        req.body.phaseTwo.environmentBrightness == null ||
        req.body.phaseTwo.theme == null ||
        req.body.phaseTwo.layout == null ||
        req.body.phaseTwo.fontSize == null ||
        req.body.phaseTwo.predictionProbability == null ||
        req.body.phaseTwo.output == null) {

        console.log("Phase2 field is required!");
        return res.status(500).send({ m: "nok" });
    }


    createPhaseTwoInstance(req.body.phaseTwo).then((phaseTwoID) => {
        User.findOneAndUpdate({ username: req.body.username },
            { $push: { phaseTwoData: phaseTwoID } }, function (err, userDoc) {
                if (err || userDoc == null) {
                    console.log("Error while searching for a user by username (phase2)");
                    console.log(err);
                    return res.status(500).send({ m: "nok" });
                }

                return res.status(200).send({ m: "ok" });

            });
    }).catch(err => {
        console.log(err);
        console.log("There was an error while creating phasetwo instance!");
        res.status(500).send({ m: "nok" });
    })


};

module.exports.getAllData = (req, res) => {
    User.find({}).populate("phaseTwoData").exec(function (err, userDocs) {
        if (err) {
            console.log("error while requesting all data from phase2");
            return res.status(500).send({ m: "nok" });
        }

        return res.status(200).send(userDocs);

    });
};

module.exports.removeUser = (req, res) => {
    if (req.body.username == null || typeof req.body.username !== "string") {
        return res.status(500).send({ m: "nok" });
    }

    User.remove({ username: req.body.username }, function (err) {
        if (err) {
            return res.status(500).send({ m: "nok" });
        }

        return res.status(200).send({ m: "ok" });

    })

};