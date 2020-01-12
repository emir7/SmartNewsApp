import { Injectable } from '@angular/core';
import { Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';
import { BatteryStatus } from '@ionic-native/battery-status/ngx';
import { ContextModel, InternetStatusModel, UserActivityModel, BatteryStatusModel, BrightnessModel, ViewDescription } from './models/context/contextModel';
import { take } from 'rxjs/operators';

const { Network, UsersPARecognition, MySensors, Filesystem } = Plugins;

@Injectable()
export class SensorReadingService {

    currentContext = new BehaviorSubject<ContextModel>({
        batteryObj: {
            plugged: false,
            level: 1,
            percentage: 50
        },
        brightnessObj: {
            level: 1,
            value: 30
        },
        internetObj: {
            type: 'none',
            strength: - 1,
            value: -1
        },
        userActivityObj: {
            types: ['STILL'],
            probs: [100],
            values: [3]
        }
    });

    userPARecognition = null;
    mySensors = null;

    currentTime = 0;

    constructor(private batteryStatus: BatteryStatus) {
        this.userPARecognition = UsersPARecognition;
        this.mySensors = MySensors;

        this.userPARecognition.startTrackingUserActivity();

        this.userPARecognition.addListener('userPhysicalActivity', (data) => {
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
                level
            });

        });

        setInterval(() => {
            this.mySensors.getNetworkStatus().then((res) => {

                this.setCurrentInternetStatus({
                    type: res.type,
                    strength: res.strength,
                    value: res.value
                });
            });

        }, 5000);


        Network.addListener('networkStatusChange', (status) => {

            if (status.connected) {
                this.mySensors.getNetworkStatus().then((res) => {
                    this.setCurrentInternetStatus({
                        type: res.type,
                        strength: res.strength,
                        value: res.value
                    });
                });
            } else {
                this.setCurrentInternetStatus({
                    type: 'none',
                    strength: -1,
                    value: -1
                });
            }


        });

        this.batteryStatus.onChange().subscribe(status => {

            this.setCurrentBatteryStatus({
                level: this.getBatteryLevel(status.isPlugged, status.level),
                percentage: status.level,
                plugged: status.isPlugged
            });

        });
    }

    setCurrentInternetStatus(obj: InternetStatusModel) {
        this.getCurrentContext().pipe(take(1)).subscribe((currentContextRec) => {
            if (currentContextRec.internetObj.value !== obj.value) {
                currentContextRec.internetObj.value = obj.value;
                currentContextRec.internetObj.strength = obj.strength;
                currentContextRec.internetObj.type = obj.type;
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
            if (currentContextRec.userActivityObj.types[0] !== obj.types[0]) {
                currentContextRec.userActivityObj.types = [...obj.types];
                currentContextRec.userActivityObj.probs = [...obj.probs];
                currentContextRec.userActivityObj.values = [...obj.values];
                this.currentContext.next(currentContextRec);
            }
        });
    }

    setCurrentBrighness(obj: BrightnessModel) {
        this.getCurrentContext().pipe(take(1)).subscribe((currentContextRec) => {
            if (currentContextRec.brightnessObj.value !== obj.value) {
                currentContextRec.brightnessObj.value = obj.value;
                currentContextRec.brightnessObj.level = obj.level;
                this.currentContext.next(currentContextRec);
            }
        });
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

        console.log('d.getHours() ' + d.getHours());
        console.log('===================');

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

        Filesystem.appendFile({
            path: 'readings/interval.csv',
            data: `${uA};${brightness};${tod};${internet};${batLevel};${fvd.fontSize};${fvd.showimages};${fvd.theme};${fvd.view}\n`,
            directory: FilesystemDirectory.External,
            encoding: FilesystemEncoding.UTF8
        });
    }

}

