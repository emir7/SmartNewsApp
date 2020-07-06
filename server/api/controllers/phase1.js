const mongoose = require('mongoose')

const User = mongoose.model('User');
const Prediction = mongoose.model('Prediction');
const BanditData = mongoose.model('BanditData');
const CurrentBandit = mongoose.model('CurrentBandit');

function createPredictionInstance(predictionObj) {
    let predictionInstance = new Prediction();

    predictionInstance.userActivity = predictionObj.userActivity;
    predictionInstance.environmentBrightness = predictionObj.environmentBrightness;
    predictionInstance.theme = predictionObj.theme;
    predictionInstance.layout = predictionObj.layout;
    predictionInstance.fontSize = predictionObj.fontSize;
    predictionInstance.predictionProbability = predictionObj.predictionProbability;
    predictionInstance.output = predictionObj.output;

    return predictionInstance.save()
        .then(() => {
            return predictionInstance._id;
        });
}

function createBanditInstance(banditDataObj) {
    let banditInstance = new BanditData();

    banditInstance.trialIndex = banditDataObj.trialIndex;
    banditInstance.banditIndex = banditDataObj.banditIndex;
    banditInstance.banditDecision = banditDataObj.banditDecision;
    banditInstance.reward = banditDataObj.reward;
    banditInstance.regret = banditDataObj.regret;
    banditInstance.totalReward = banditDataObj.totalReward;

    return banditInstance.save()
        .then(() => {
            return banditInstance._id;
        });
}

module.exports.writeMetrics = (req, res) => {

    if (req.body.username == null) {
        console.log("Username not provided");
        return res.status(500).send({ m: "nok" });
    }

    if (req.body.prediction == null || req.body.banditsData == null || req.body.currentBandit == null) {
        console.log("osnovni objeki manjkajo");
        return res.status(500).send({ m: "nok" });
    }

    if (req.body.prediction.userActivity == null ||
        req.body.prediction.environmentBrightness == null ||
        req.body.prediction.theme == null ||
        req.body.prediction.layout == null ||
        req.body.prediction.fontSize == null ||
        req.body.prediction.predictionProbability == null ||
        req.body.prediction.output == null) {

        console.log(req.body.prediction);
        console.log("Required field for prediction is missing!");
        return res.status(500).send({ m: "nok" });
    }

    if (req.body.banditsData.trialIndex == null ||
        req.body.banditsData.banditIndex == null ||
        req.body.banditsData.banditDecision == null ||
        req.body.banditsData.regret == null ||
        req.body.banditsData.reward == null ||
        req.body.banditsData.totalReward == null) {
        console.log("Required banditsData field is missing!");
        return res.status(500).send({ m: "nok" });
    }

    if (req.body.currentBandit.selections == null ||
        req.body.currentBandit.regret == null ||
        req.body.currentBandit.totalReward == null ||
        req.body.currentBandit.allTimePulls == null ||
        req.body.currentBandit.numberOfSelections == null ||
        req.body.currentBandit.sumOfRewards == null) {
        console.log("Required field for currentBandit is missing!");
        return res.status(500).send({ m: "nok" });
    }


    Promise.all([createPredictionInstance(req.body.prediction), createBanditInstance(req.body.banditsData)])
        .then(idArr => {


            let predictionID = idArr[0];
            let banditID = idArr[1];


            User.findOneAndUpdate({ username: req.body.username }, { $push: { predictions: predictionID, banditsData: banditID } }, function (err, userDoc) {

                if (err || userDoc == null) {
                    console.log("Error while searching for a user by username");
                    console.log(err);
                    return res.status(500).send({ m: "nok" });
                }


                const selectionVals = JSON.parse(req.body.currentBandit.selections);
                const regret = req.body.currentBandit.regret;
                const totalReward = req.body.currentBandit.totalReward;
                const allTimePulls = req.body.currentBandit.allTimePulls;
                const numberOfSelections = JSON.parse(req.body.currentBandit.numberOfSelections);
                const sumOfRewards = JSON.parse(req.body.currentBandit.sumOfRewards);

                CurrentBandit.update({ _id: userDoc.currentBandit }, {
                    $set: {
                        selections: selectionVals,
                        regret: regret,
                        totalReward: totalReward,
                        allTimePulls: allTimePulls,
                        numberOfSelections: numberOfSelections,
                        sumOfRewards: sumOfRewards
                    }
                }, function (err, currentBanditDoc) {
                    if (err || currentBanditDoc == null) {
                        console.log(err);
                        console.log("Error while updating currentBaniditObject!");
                        return res.status(500).send({ m: "nok" });
                    }

                    return res.status(200).send({ m: "ok" });
                });


            });


        })
        .catch(err => {
            console.log("Error while executing promise array!");
            res.status(500).send({ m: "nok" });
            console.log(err);
        })


};


module.exports.getAllData = (req, res) => {
    User.find({}).populate("predictions banditsData currentBandit").exec(function (err, userDocs) {
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