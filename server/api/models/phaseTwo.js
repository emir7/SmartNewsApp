const mongoose = require('mongoose');

let phaseTwoSchema = new mongoose.Schema({
    algorithm: {
        type: mongoose.Schema.Types.Number,
        required: true
    },

    userActivity: {
        type: mongoose.Schema.Types.String,
        required: true,
        maxlength: 50
    },

    environmentBrightness: {
        type: mongoose.Schema.Types.Number,
        required: true
    },

    theme: {
        type: mongoose.Schema.Types.String,
        required: true,
        maxlength: 50
    },

    layout: {
        type: mongoose.Schema.Types.String,
        required: true,
        maxlength: 50
    },

    fontSize: {
        type: mongoose.Schema.Types.String,
        required: true,
        maxlength: 50
    },

    predictionProbability: {
        type: mongoose.Schema.Types.Number,
        required: true
    },

    output: {
        type: mongoose.Schema.Types.String,
        required: true,
        maxlength: 50
    }

});

mongoose.model("PhaseTwo", phaseTwoSchema);