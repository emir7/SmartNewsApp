import { OnInit, OnDestroy, Component, ChangeDetectorRef } from '@angular/core';
import { SensorReadingService } from '../shared/sensor.reading.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sensor-test',
    templateUrl: 'sensor.test.page.html',
    styleUrls: ['sensor.test.page.scss'],
})
export class SenosorTestPage implements OnInit, OnDestroy {

    currentContextSub: Subscription;

    internetStatus;
    batteryStatus;
    userActivity;
    brightnessStatus;

    currentTime = 0;
    constructor(private sensorDetectionService: SensorReadingService, private changeDetector: ChangeDetectorRef) { }

    ngOnInit() {
        this.currentContextSub = this.sensorDetectionService.getCurrentContext().subscribe((contextRec) => {
            this.internetStatus = contextRec.internetObj;
            this.batteryStatus = contextRec.batteryObj;
            this.userActivity = contextRec.userActivityObj;
            this.brightnessStatus = contextRec.brightnessObj;
            this.changeDetector.detectChanges();
        });

        this.currentTime = this.sensorDetectionService.getCurrentTime();
        this.changeDetector.detectChanges();

    }

    ngOnDestroy() {
        if (this.currentContextSub) {
            this.currentContextSub.unsubscribe();
        }
    }

}
