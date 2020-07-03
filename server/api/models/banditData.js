const mongoose = require('mongoose');


let banditDataSchema = new mongoose.Schema({

    trialIndex: {
        type: mongoose.Schema.Types.Number,
        required: true
    },

    banditIndex: {
        type: mongoose.Schema.Types.Number,
        required: true
    },

    banditDecision: {
        type: mongoose.Schema.Types.Boolean,
        required: true
    },

    reward: {
        type: mongoose.Schema.Types.Number,
        required: true
    },

    regret: {
        type: mongoose.Schema.Types.Number,
        required: true
    },

    totalReward: {
        type: mongoose.Schema.Types.Number,
        required: true
    }


});


mongoose.model("BanditData", banditDataSchema);