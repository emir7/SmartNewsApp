import { Injectable } from '@angular/core';
import { Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';
import { BatteryStatus } from '@ionic-native/battery-status/ngx';
import { ContextModel, InternetStatusModel, UserActivityModel, BatteryStatusModel, BrightnessModel, ViewDescription } from './models/context/contextModel';
import { take } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage';

const { Network, UsersPARecognition, MySensors, Filesystem } = Plugins;

@Injectable()
export class SensorReadingService {

    //currentState = 'INTERVAL_SAMPLING';
    //currentState = 'LAB_SAMPLING';
    //currentState = 'ON_CHANGE_SAMPLING';
    serverUrl = 'http://163.172.169.249:9082/';

    currentState = 'SMART_SAMPLING';
    daysPassed = 0;
    //currentState = 'LAB_SAMPLING';
    modelSelected = 0;

    currentContext = new BehaviorSubject<ContextModel>({
        batteryObj: {
            plugged: false,
            level: 1,
            percentage: 50,
        },
        brightnessObj: {
            level: 1,
            value: 30,
        },
        internetObj: {
            type: 'none',
            strength: - 1,
            value: -1,
        },
        userActivityObj: {
            types: ['STILL'],
            probs: [100],
            values: [3]
        },
        validObjs: [false, false, false] // user_activity, brightness, internet_status
    });

    userPARecognition = null;
    mySensors = null;

    timeWatch = false;
    currentTime = 0;

    constructor(private batteryStatus: BatteryStatus, private http: HttpClient, private storage: Storage) {

        this.userPARecognition = UsersPARecognition;
        this.mySensors = MySensors;

        this.userPARecognition.startTrackingUserActivity();

        this.userPARecognition.addListener('userPhysicalActivity', (data) => {
            console.log("EOOOOO_MEEEE");
            console.log(data);
            console.log("===============");

            this.setCurrentUserActivity({
                probs: data.probs,
                values: data.values,
                types: data.types
            });
        });

        this.mySensors.startBrigtnessSensor();

        this.mySensors.addListener('mySensorBrightness', (data) => {

            let level = 0;

            if (data.value < 20) {
                level = 0;
            }
            if (data.value >= 20 && data.value < 100) {
                level = 1;
            }

            if (data.value > 100) {
                level = 2;
            }

            this.setCurrentBrighness({
                value: data.value,
                level,
            });

        });

        this.getCurrentInternetStatus();

        setInterval(() => {
            this.getCurrentInternetStatus();
        }, 5000);


        Network.addListener('networkStatusChange', (status) => {

            if (status.connected) {
                this.mySensors.getNetworkStatus().then((res) => {
                    this.setCurrentInternetStatus({
                        type: res.type,
                        strength: res.strength,
                        value: res.value,
                    });
                });
            } else {
                this.setCurrentInternetStatus({
                    type: 'none',
                    strength: -1,
                    value: -1,
                });
            }


        });

        this.batteryStatus.onChange().subscribe(status => {
            this.setCurrentBatteryStatus({
                level: this.getBatteryLevel(status.isPlugged, status.level),
                percentage: status.level,
                plugged: status.isPlugged,
            });
        });
    }

    getCurrentInternetStatus() {
        this.mySensors.getNetworkStatus().then((res) => {

            this.setCurrentInternetStatus({
                type: res.type,
                strength: res.strength,
                value: res.value,
            });
        });
    }

    setCurrentInternetStatus(obj: InternetStatusModel) {
        this.getCurrentContext().pipe(take(1)).subscribe((currentContextRec) => {
            if (currentContextRec.internetObj.value !== obj.value) {
                currentContextRec.internetObj.value = obj.value;
                currentContextRec.internetObj.strength = obj.strength;
                currentContextRec.internetObj.type = obj.type;
                currentContextRec.validObjs[2] = true;
                this.currentContext.next(currentContextRec);
            }
        });
    }

    setCurrentBatteryStatus(obj: BatteryStatusModel) {
        this.getCurrentContext().pipe(take(1)).subscribe((currentContextRec) => {
            if (currentContextRec.batteryObj.percentage !== obj.percentage) {
                currentContextRec.batteryObj.percentage = obj.percentage;
                currentContextRec.batteryObj.level = obj.level;
                currentContextRec.batteryObj.plugged = obj.plugged;
                this.currentContext.next(currentContextRec);
            }
        });

    }

    setCurrentUserActivity(obj: UserActivityModel) {
        this.getCurrentContext().pipe(take(1)).subscribe((currentContextRec) => {

            currentContextRec.userActivityObj.types = [...obj.types];
            currentContextRec.userActivityObj.probs = [...obj.probs];
            currentContextRec.userActivityObj.values = [...obj.values];
            currentContextRec.validObjs[0] = true;
            this.currentContext.next(currentContextRec);

        });
    }

    setCurrentBrighness(obj: BrightnessModel) {
        this.getCurrentContext().pipe(take(1)).subscribe((currentContextRec) => {
            currentContextRec.brightnessObj.value = obj.value;
            currentContextRec.brightnessObj.level = obj.level;
            currentContextRec.validObjs[1] = true;
            this.currentContext.next(currentContextRec);
        });
    }

    setValidObjs(validObjsArr) {
        this.getCurrentContext().pipe(take(1)).subscribe((currentContextRec) => {
            currentContextRec.validObjs = [...validObjsArr];
            this.currentContext.next(currentContextRec);
        });
    }

    getScreenBrightness() {
        return this.mySensors.getScreenBrightness();
    }

    getCurrentContext() {
        return this.currentContext.asObservable();
    }

    getBatteryLevel(isPlugged, percentage) {
        if (isPlugged) {
            if (percentage < 15) {
                return 0;
            }
            return 2;
        }

        if (percentage <= 15) {
            return 0;
        }

        if (percentage < 50) {
            return 1;
        }

        return 2;

    }

    evalTime(d: Date) {

        if (d.getHours() >= 0 && d.getHours() < 12) {
            this.currentTime = 0;
        }

        if (d.getHours() >= 12 && d.getHours() <= 18) {
            this.currentTime = 1;
        }

        if (d.getHours() > 18 && d.getHours() <= 23) {
            this.currentTime = 2;
        }

    }

    getCurrentTime() {
        this.evalTime(new Date());
        return this.currentTime;
    }

    writeToFile(fvd: ViewDescription, ctx: ContextModel) {
        const uA = ctx.userActivityObj.types[0];
        const brightness = ctx.brightnessObj.value;
        const tod = new Date().getHours();
        const internet = ctx.internetObj.value;
        const batLevel = ctx.batteryObj.percentage;

        if (this.getCurrentState() === 'INTERVAL_SAMPLING') {
            Filesystem.appendFile({
                path: 'readings/interval.csv',
                data: `${uA};${brightness};${tod};${internet};${batLevel};${fvd.fontSize};${fvd.showimages};${fvd.theme};${fvd.view}\n`,
                directory: FilesystemDirectory.External,
                encoding: FilesystemEncoding.UTF8
            });
        }

    }

    writeToFileOnlyOnContextChange(uA, brightness, tod, internet, batLevel, fvd: ViewDescription) {
        const t = (new Date().getTime() - fvd.d.getTime()) / 1000;
        if (uA == null || brightness === -2 || batLevel === -2) {
            return;
        }
        Filesystem.appendFile({
            path: 'readings/onchange.csv',
            data: `${uA};${brightness};${tod};${internet};${batLevel};${fvd.fontSize};${fvd.showimages};${fvd.theme};${fvd.view};${t}\n`,
            directory: FilesystemDirectory.External,
            encoding: FilesystemEncoding.UTF8
        });
    }

    readFileContent() {
        return Filesystem.readFile({
            path: 'readings/onchange.csv',
            directory: FilesystemDirectory.External,
            encoding: FilesystemEncoding.UTF8
        }).then(data => {
            return data;
        });
    }

    setTimeWatch() {
        this.timeWatch = true;
    }

    getCurrentState() {
        return this.currentState;
    }

    sendCurrentContextToServer(ctx: ContextModel, qResult, fvd: ViewDescription, userInfo) {
        if (this.currentState === 'LAB_SAMPLING') {
            this.getScreenBrightness().then((obj) => { // sending screen brightness
                console.log(obj.screenBrightness);
                const uA = ctx.userActivityObj.types[0];
                const brightness = ctx.brightnessObj.value;
                const tod = new Date().getHours();
                const internet = ctx.internetObj.value;
                const batLevel = ctx.batteryObj.percentage;
                const preferenceAnswer = qResult.p;
                const readabiltyAnswer = qResult.r;
                const informativnessAnswer = qResult.i;

                if (fvd.view === 'gridView') { // grid view cant be with large font
                    fvd.fontSize = 'small-font';
                }

                const contextData = `${uA};${brightness};${obj.screenBrightness};${tod};${internet};${batLevel}`;
                const fvdData = `${fvd.showimages};${fvd.theme};${fvd.view};${fvd.fontSize}`;
                const quizResult = `${preferenceAnswer};${readabiltyAnswer};${informativnessAnswer}`;
                const data = `${contextData};${fvdData};${quizResult};${userInfo.username};${userInfo.id}`;

                const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });
                this.http.post(`${this.serverUrl}data/`, { data }, { headers }).subscribe((res) => {
                    console.log(res);
                }, (err) => {
                    console.log('err');
                    console.log(err);
                });
            });

        }

    }
}

