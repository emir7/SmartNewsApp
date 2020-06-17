const fs = require("fs");
const path = require("path");

function checkIfFolderExists(fileDirDestination) {
    return fs.existsSync(fileDirDestination);
}

function initFilesFirstTime(filePathModel, filePathBanditCSV, filePathBanditJSON, dataModel, predictionPathCSV) {
    fs.writeFileSync(filePathModel, "PRECISION;RECALL;ACCURACY;F-SCORE;THRESHOLD\n");
    fs.appendFileSync(filePathModel, dataModel + "\n");
    fs.writeFileSync(filePathBanditCSV, "TRIAL_INDEX;BANIDT_INDEX;BANDIT_DECISION;REGRET;TOTAL_REWARD\n");
    fs.writeFileSync(filePathBanditJSON, "");
    fs.writeFileSync(predictionPathCSV, "USER_ACTIVITY;ENV_BRIGHTNESS;THEME;LAYOUT;FONT_SIZE;BOUNDRY;PROB;OUTPUT\n");
}

function appendDataToFiles(filePathModel, filePathBanditCSV, filePathBanditJSON, modelData, banditCSVData, banditJSON, predictionPathCSV, predictionData) {
    if (modelData === "same;as;before") {
        appendLastLineToFile(filePathModel);
    } else {
        fs.appendFileSync(filePathModel, modelData + "\n");
    }

    fs.appendFileSync(filePathBanditCSV, banditCSVData + "\n");
    fs.writeFileSync(filePathBanditJSON, JSON.stringify(banditJSON) + "\n");
    fs.appendFileSync(predictionPathCSV, predictionData + "\n");
}

function appendLastLineToFile(filePath) {
    const data = fs.readFileSync(filePath, {
        encoding: 'utf-8'
    });

    const splitedArr = data.split("\n");
    const lastLine = splitedArr[splitedArr.length - 2];

    fs.appendFileSync(filePath, lastLine + "\n");
}

module.exports.writeMetrics = (req, res) => {

    if (typeof req.body.firstTime === "boolean") {

        if (req.body.firstTime) {
            if (req.body.username == null) {
                console.log('RETURNING NOK   1');
                return res.status(500).send({
                    m: 'NOK'
                });
            }

            const username = req.body.username;
            const dataModel = req.body.dataModel;
            const fileDirDestination = path.join(__dirname, '..', '..', 'phase1', username);

            const filePathModel = path.join(__dirname, '..', '..', 'phase1', username, 'model.csv');
            const filePathBanditCSV = path.join(__dirname, '..', '..', 'phase1', username, 'bandit.csv');
            const filePathBanditJSON = path.join(__dirname, '..', '..', 'phase1', username, 'bandit.json');
            const predictionPathCSV = path.join(__dirname, '..', '..', 'phase1', username, 'prediction.csv');


            if (!checkIfFolderExists(fileDirDestination)) {
                fs.mkdirSync(fileDirDestination);
                initFilesFirstTime(filePathModel, filePathBanditCSV,
                    filePathBanditJSON, dataModel,
                    predictionPathCSV);
                return res.status(200).send({
                    m: 'OK'
                });
            }
        } else {
            const username = req.body.username;

            console.log('USERNAME = ' + username);

            const dataModel = req.body.dataModel;
            const dataBanditCSV = req.body.banditCSV;
            const dataBanditJSON = req.body.banditJSON;
            const predictionData = req.body.predictionDATA;

            console.log("PRED_DATA: " + predictionData);

            const fileDirDestination = path.join(__dirname, '..', '..', 'phase1', username);
            const filePathModel = path.join(__dirname, '..', '..', 'phase1', username, 'model.csv');
            const filePathBanditCSV = path.join(__dirname, '..', '..', 'phase1', username, 'bandit.csv');
            const filePathBanditJSON = path.join(__dirname, '..', '..', 'phase1', username, 'bandit.json');
            const predictionPathCSV = path.join(__dirname, '..', '..', 'phase1', username, 'prediction.csv');


            if (!checkIfFolderExists(fileDirDestination)) {
                console.log('RETURNING NOK   2');
                return res.status(500).send({
                    m: 'NOK'
                });
            }

            appendDataToFiles(filePathModel, filePathBanditCSV,
                filePathBanditJSON, dataModel, dataBanditCSV,
                dataBanditJSON, predictionPathCSV, predictionData);

            return res.status(200).send({
                m: 'OK'
            });
        }
    } else {
        return res.status(200).send({
            m: 'OK'
        });
    }

};