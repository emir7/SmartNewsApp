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
    }

    ngOnDestroy() {
        if (this.userActivitySub) {
            this.userActivitySub.unsubscribe();
        }

        if (this.userActivityProbSub) {
            this.userActivityProbSub.unsubscribe();
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
