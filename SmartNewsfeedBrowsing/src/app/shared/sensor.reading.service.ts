import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';
import { BatteryStatus } from '@ionic-native/battery-status/ngx';
const { Network } = Plugins;

const { UsersPARecognition, MySensors } = Plugins;

@Injectable()
export class SensorReadingService {

    userActivityTypeArr = new BehaviorSubject<number[]>([]);
    userActivityTypeProbArr = new BehaviorSubject<number[]>([]);

    brightnessValue = new BehaviorSubject<number>(0);

    wifiLevel = new BehaviorSubject<number>(0);
    cellularNetworkType = new BehaviorSubject<string>('');

    batteryLevel = new BehaviorSubject<number>(0);
    batteryPluged = new BehaviorSubject<boolean>(false);

    userPARecognition = null;
    mySensors = null;

    constructor(private batteryStatus: BatteryStatus) {
        this.userPARecognition = UsersPARecognition;
        this.mySensors = MySensors;

        this.userPARecognition.startTrackingUserActivity();

        this.userPARecognition.addListener('userPhysicalActivity', (data) => {
            this.setUserActivityTypeArr(data.types);
            this.setUserActivityTypeProbArr(data.probs);
        });

        this.mySensors.startBrigtnessSensor();

        this.mySensors.addListener('mySensorBrightness', (data) => {
            this.setBrightnessValue(data.value);
        });

        this.mySensors.getNetworkStatus().then((res) => {
            if (res.type === 'wifi') {
                this.setWifiLevel(res.value);
            } else if (res.type === 'cellular') {
                this.setCellularNetworkType(res.value);
            }
        });

        Network.addListener('networkStatusChange', (status) => {
            if (status.connected) {
                if (status.connectionType === 'wifi') {
                    this.mySensors.getNetworkStatus().then((res) => {
                        this.setWifiLevel(res.value);
                    });
                } else if (status.connectionType === 'cellular') {
                    this.mySensors.getNetworkStatus().then((res) => {
                        this.setCellularNetworkType(res.value);
                    });
                }
            } else {
                this.setCellularNetworkType(null);
                this.setWifiLevel(null);
            }
        });

        this.batteryStatus.onChange().subscribe(status => {
            console.log('batery status:');
            console.log(status.level, status.isPlugged);
            this.setBatteryLevel(status.level);
            this.setBatteryPluged(status.isPlugged);
        });
    }

    setUserActivityTypeArr(values) {
        this.userActivityTypeArr.next([...values]);
    }

    setUserActivityTypeProbArr(values) {
        this.userActivityTypeProbArr.next([...values]);
    }

    setBrightnessValue(value) {
        this.brightnessValue.next(value);
    }

    setWifiLevel(value) {
        this.wifiLevel.next(value);
    }

    getWifiLevel() {
        return this.wifiLevel.asObservable();
    }

    setCellularNetworkType(value) {
        this.cellularNetworkType.next(value);
    }

    getCellularNetworkType() {
        return this.cellularNetworkType.asObservable();
    }

    getBrighntessValue() {
        return this.brightnessValue.asObservable();
    }

    getUserActivityTypeArr() {
        return this.userActivityTypeArr.asObservable();
    }

    geUserActivityTypeProbArr() {
        return this.userActivityTypeProbArr.asObservable();
    }

    getBatteryPluged() {
        return this.batteryPluged.asObservable();
    }

    setBatteryPluged(value) {
        this.batteryPluged.next(value);
    }

    getBatteryLevel() {
        return this.batteryLevel.asObservable();
    }

    setBatteryLevel(value) {
        this.batteryLevel.next(value);
    }
}

