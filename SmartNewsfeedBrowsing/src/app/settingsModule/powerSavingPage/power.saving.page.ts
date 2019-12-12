import { OnInit, OnDestroy, Component, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { PerformanceService } from 'src/app/shared/performance.service';
import { Storage } from '@ionic/storage';

@Component({
    selector: 'app-power-saving',
    templateUrl: 'power.saving.page.html',
    styleUrls: ['power.saving.page.scss'],
})
export class PowerSavingPage implements OnInit, OnDestroy {

    showImage = true;
    cache = true;

    constructor(private performanceService: PerformanceService, private storage: Storage) {

    }

    ngOnInit() {
        this.storage.get('cache').then((val) => {
            if (typeof val !== 'boolean') {
                this.cache = true;
            } else {
                this.cache = val;
                this.performanceService.setCache(val);
            }
        });

        this.storage.get('showImage').then((val) => {
            if (typeof val !== 'boolean') {
                this.showImage = true;
            } else {
                this.showImage = val;
                this.performanceService.setCache(val);
            }
        });

    }

    ngOnDestroy() {
        this.performanceService.setCache(this.cache);
        this.performanceService.setShowImage(this.showImage);
        this.storage.set('showImage', this.showImage);
        this.storage.set('cache', this.cache);
    }

}
