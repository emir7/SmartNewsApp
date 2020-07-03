const mongoose = require('mongoose')

const User = mongoose.model('User');
const CurrentBandit = mongoose.model('CurrentBandit');

module.exports.createUser = (req, res) => {
    if (req.body.username == null || typeof req.body.username != "string") {
        res.status(404).send({ m: "nok" });
        return;
    }

    let user = new User();
    user.generateUsername(req.body.username);


    let currentBandit = new CurrentBandit();

    currentBandit.save()
        .then(() => {
            user.currentBandit = currentBandit._id;
            return user.save();
        })
        .then(() => {
            res.status(200).send({ m: "ok" });
        })
        .catch(err => {
            console.log("There was an error while creating user!");
            console.log(err);
            res.status(500).send({ m: "nok" });
        });


};

module.exports.getAllUsers = (req, res) => {

    User.find({}).then(result => {
        res.status(200).send(result);
    }).catch(err => {
        res.status(500).send({ m: "nok" });
        console.log("There was an error requesting all users");
        console.log(err);
    })

};