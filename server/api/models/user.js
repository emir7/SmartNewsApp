const mongoose = require('mongoose');

let usersSchema = new mongoose.Schema({

    username: {
        unique: true,
        required: true,
        type: mongoose.Schema.Types.String
    },

    predictions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prediction",
        required: true
    }],

    banditsData: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "BanditData",
        required: true
    }],

    currentBandit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CurrentBandit",
        required: true
    },

    phaseTwoData: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "PhaseTwo",
        required: true
    }]

});


usersSchema.methods.generateUsername = function (username) {
    this.username = username;
};

mongoose.model("User", usersSchema);