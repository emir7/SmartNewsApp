import { OnInit, OnDestroy, Component, ViewChild, ChangeDetectorRef, AfterViewInit, Input } from '@angular/core';
import { PerformanceService } from 'src/app/shared/performance.service';
import { Storage } from '@ionic/storage';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-power-saving',
    templateUrl: 'power.saving.page.html',
    styleUrls: ['power.saving.page.scss'],
})

export class PowerSavingPage implements OnInit, OnDestroy {

    showImage: boolean;
    cache: boolean;

    constructor(private performanceService: PerformanceService, private storage: Storage) { }

    ngOnInit() {
        this.performanceService.getCache().pipe(take(1)).subscribe((cacheVal) => {
            this.cache = cacheVal;
        });

        this.performanceService.getShowImage().pipe(take(1)).subscribe((showImageVal) => {
            this.showImage = showImageVal;
        });

    }

    ngOnDestroy() {
        this.performanceService.setCache(this.cache);
        this.performanceService.setShowImage(this.showImage);
        this.storage.set('showImage', this.showImage);
        this.storage.set('cache', this.cache);
    }

}
