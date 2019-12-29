import { OnInit, OnDestroy, Component, ChangeDetectorRef } from '@angular/core';
import { SensorReadingService } from '../shared/sensor.reading.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sensor-test',
    templateUrl: 'sensor.test.page.html',
    styleUrls: ['sensor.test.page.scss'],
})
export class SenosorTestPage implements OnInit, OnDestroy {

    userActivityArr = [];
    userActivityProbArr = [];

    userActivitySub: Subscription;
    userActivityProbSub: Subscription;

    brighntessValue = 0;

    brighnessSub: Subscription;

    cellularNetworkType = null;
    wifiLevel = null;

    wifiSub: Subscription;
    cellularNetworkSub: Subscription;

    batLevel = 0;
    batPluged = false;

    batLevelSub: Subscription;
    batPlugSub: Subscription;

    constructor(private sensorDetectionService: SensorReadingService, private changeDetector: ChangeDetectorRef) { }

    ngOnInit() {
        this.userActivitySub = this.sensorDetectionService.getUserActivityTypeArr().subscribe((values) => {
            this.userActivityArr = [...values];
            this.changeDetector.detectChanges();
        });

        this.userActivityProbSub = this.sensorDetectionService.geUserActivityTypeProbArr().subscribe((values) => {
            this.userActivityProbArr = [...values];
            this.changeDetector.detectChanges();
        });

        this.brighnessSub = this.sensorDetectionService.getBrighntessValue().subscribe((value) => {
            this.brighntessValue = value;
            this.changeDetector.detectChanges();
        });

        this.wifiSub = this.sensorDetectionService.getWifiLevel().subscribe((value) => {
            this.wifiLevel = value;
            if (value && value !== 0) {
                this.cellularNetworkType = null;
            }
            this.changeDetector.detectChanges();
        });

        this.cellularNetworkSub = this.sensorDetectionService.getCellularNetworkType().subscribe((value) => {
            if (value && value.length !== 0) {
                this.wifiLevel = null;
            }
            this.cellularNetworkType = value;
            this.changeDetector.detectChanges();
        });

        this.batLevelSub = this.sensorDetectionService.getBatteryLevel().subscribe((value) => {
            this.batLevel = value;
            this.changeDetector.detectChanges();
        });

        this.batPlugSub = this.sensorDetectionService.getBatteryPluged().subscribe((value) => {
            this.batPluged = value;
            this.changeDetector.detectChanges();
        });

    }

    ngOnDestroy() {
        if (this.userActivitySub) {
            this.userActivitySub.unsubscribe();
        }

        if (this.userActivityProbSub) {
            this.userActivityProbSub.unsubscribe();
        }

        if (this.brighnessSub) {
            this.brighnessSub.unsubscribe();
        }

        if (this.wifiSub) {
            this.wifiSub.unsubscribe();
        }

        if (this.cellularNetworkSub) {
            this.cellularNetworkSub.unsubscribe();
        }

        if (this.batPlugSub) {
            this.batPlugSub.unsubscribe();
        }

        if (this.batLevelSub) {
            this.batLevelSub.unsubscribe();
        }

    }

    mapToUserActivity(n) {
        switch (n) {
            case 0: return 'IN_VEHICLE';
            case 1: return 'ON_BICYCLE';
            case 2: return 'ON_FOOT';
            case 3: return 'STILL';
            case 4: return 'UNKNOWN';
            case 5: return 'TILTING';
            case 7: return 'WALKING';
            case 8: return 'RUNNING';
        }
    }

}
