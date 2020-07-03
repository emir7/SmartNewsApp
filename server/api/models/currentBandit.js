const mongoose = require('mongoose');


let currentBanditSchema = new mongoose.Schema({

    selections: [mongoose.Schema.Types.Number],

    regret: {
        type: mongoose.Schema.Types.Number,
        required: true,
        default: 0
    },

    totalReward: {
        type: mongoose.Schema.Types.Number,
        required: true,
        default: 0
    },

    allTimePulls: {
        type: mongoose.Schema.Types.Number,
        required: true,
        default: 0
    },

    numberOfSelections: [mongoose.Schema.Types.Number],

    sumOfRewards: [mongoose.Schema.Types.Number]

});

mongoose.model("CurrentBandit", currentBanditSchema);
