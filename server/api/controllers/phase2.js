const fs = require("fs");
const path = require("path");


function checkIfFolderExists(fileDirDestination) {
    return fs.existsSync(fileDirDestination);
}

function initFileAppendData(predictionPathCSV, actualData) {
    fs.writeFileSync(predictionPathCSV, "ALGO;USER_ACTIVITY;ENV_BRIGHTNESS;THEME;LAYOUT;FONT_SIZE;BOUNDRY;PROB;OUTPUT\n");
    appendData(predictionPathCSV, actualData);
}

function appendData(predictionPathCSV, actualData) {
    fs.appendFileSync(predictionPathCSV, actualData + "\n");
}

module.exports.writeData = (req, res) => {

    const username = req.body.username;
    const predictionDATA = req.body.predictionDATA;

    const fileDirDestination = path.join(__dirname, '..', '..', 'phase2', username);
    const predictionPathCSV = path.join(__dirname, '..', '..', 'phase2', username, 'prediction.csv');

    if (!checkIfFolderExists(fileDirDestination)) {
        fs.mkdirSync(fileDirDestination);
        initFileAppendData(predictionPathCSV, predictionDATA);
    } else {
        appendData(predictionPathCSV, predictionDATA);
    }

    res.status(200).send({
        m: "OK"
    });

};