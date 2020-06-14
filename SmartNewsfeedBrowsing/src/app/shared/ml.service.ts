import { Injectable } from '@angular/core';
import { Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
import { SensorReadingService } from './sensor.reading.service';
import { BehaviorSubject } from 'rxjs';

const { Filesystem } = Plugins;

@Injectable()
export class MlService {

    private BANDIT_PATH = 'bandits/data.json';
    machineLearningPlugin = null;
    modelPredictions = new BehaviorSubject(null);

    constructor(private sensorReadingService: SensorReadingService) {
        const { MachineLearning } = Plugins;
        this.machineLearningPlugin = MachineLearning;
    }

    readFileContent(path) {
        return Filesystem.readFile({
            path,
            directory: FilesystemDirectory.External,
            encoding: FilesystemEncoding.UTF8
        });
    }

    upperConfidenceBound() {
        console.log("KLIČEM SE");

        return this.machineLearningPlugin.banditFileExists().then((retData) => {
            console.log("Java mi je rekla");
            console.log(retData);
            if (!retData.e) {
                if (retData.exists) {
                    return this.readFileContent(this.BANDIT_PATH);
                } else {
                    return {
                        selections: [],
                        regret: 0,
                        totalReward: 0,
                        allTimePuls: 0,
                        numberOfSelections: [0, 0, 0, 0], // [SOFTMAX, RANDOM, RANDOM_UA, CONFIDENCE]
                        sumOfRewards: [0, 0, 0, 0]
                    };
                }
            } else {
                throw Error('Problem creating bandit file first time!');
            }
        }).then((banditData) => {
            console.log(banditData);
            console.log(banditData);
            console.log(JSON.stringify(banditData));
            console.log("..................................");

            if (banditData.data != null) {
                banditData = JSON.parse(banditData.data);
            }

            if (typeof banditData.sumOfRewards === 'string') {
                banditData.sumOfRewards = JSON.parse(banditData.sumOfRewards);
            }

            let selectedPull = 0;
            let maxUpperBound = 0;
            for (let i = 0; i < 4; i++) {
                let upperBound = 0;
                if (banditData.numberOfSelections[i] > 0) {
                    const avgReward = banditData.sumOfRewards[i] / banditData.numberOfSelections[i]; // 0
                    const delta = Math.sqrt(2 * Math.log(banditData.allTimePuls + 1) / banditData.numberOfSelections[i]);
                    upperBound = avgReward + delta;
                    console.log('UPPERBOUND = ' + upperBound);
                    console.log('.=.=.=.=.=.=.=.=.=.=.=.=');
                } else {
                    upperBound = Number.POSITIVE_INFINITY;
                }

                if (upperBound > maxUpperBound) {
                    maxUpperBound = upperBound;
                    selectedPull = i;
                }
            }

            banditData.selections.push(selectedPull);
            banditData.numberOfSelections[selectedPull]++;
            banditData.allTimePuls++;
            return banditData;
        }).then((updatedBanditData) => {
            this.writeBanditsToFile(updatedBanditData);
            return updatedBanditData;
        }).catch(err => {
            console.log('Bandit Error');
            console.log(err);
        });
    }

    writeBanditsToFile(banditData) {
        console.log(".....................");
        console.log(banditData);
        console.log(JSON.stringify(banditData));
        console.log(".....................");
        return Filesystem.writeFile({
            path: this.BANDIT_PATH,
            data: JSON.stringify(banditData),
            directory: FilesystemDirectory.External,
            encoding: FilesystemEncoding.UTF8
        });
    }

    marginalSoftmax(predictions, selectedIndex) {
        return false;
        return new Promise((resolve, reject) => {
            let s = 0;
            const epsilon = 0.5;
            for (const predData of predictions) {
                s += Math.exp(predData.p);
            }

            const results = [];
            for (const predData of predictions) {
                results.push(predData.p / s);
            }

            results.sort();
            const max1 = results[results.length - 1];
            const max2 = results[results.length - 2];

            const marginalDiff = 1 - (max1 - max2);

            if (marginalDiff >= epsilon) {
                resolve(true);
            } else {
                if (predictions[selectedIndex].p > 0.8) {
                    resolve(Math.random() <= (1 - predictions[selectedIndex].p));
                }
            }

            resolve(false);
        });

    }

    randomSelection() {
        return false;
        return new Promise((resolve, reject) => {
            resolve(Math.random() < 0.5);
        });
    }

    randomByUserActivity(ua) {
        return false;

        return this.countUserActivityOccurances().then((occurancesData) => {
            const cStill = occurancesData.cStill;
            const cFoot = occurancesData.cFoot;
            const cVehicle = occurancesData.cVehicle;

            const onFootCoef = Math.round(cStill / cFoot);
            const stillCoef = 1;
            const inVehicleCoef = Math.round(cStill / cVehicle);

            const stillProbability = 1 / (onFootCoef + stillCoef + inVehicleCoef);
            const vehicleProbability = stillProbability * inVehicleCoef;
            const footProbability = stillProbability * onFootCoef;


            if (ua === 'STILL') {
                return Math.random() <= stillProbability;
            } else if (ua === 'IN_VEHICLE') {
                return Math.random() <= vehicleProbability;
            } else {
                return Math.random() <= footProbability;
            }
        });

    }

    setModelPredictions(obj) {
        this.modelPredictions.next(obj);
    }

    getModelPredictions() {
        return this.modelPredictions.asObservable();
    }

    countUserActivityOccurances() {
        return this.machineLearningPlugin.countByUA();
    }

    leastConfidence(maxConfidentPrediction, decisionBoundry) {
        return false;
        return new Promise((resolve, reject) => {
            if (decisionBoundry > 0.7) {
                resolve(maxConfidentPrediction < decisionBoundry);
            }

            resolve(maxConfidentPrediction <= (decisionBoundry + 0.2));
        });

    }
}
