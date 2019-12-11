import { OnInit, OnDestroy, Component, ViewChild } from '@angular/core';
import { PerformanceService } from 'src/app/shared/performance.service';

@Component({
    selector: 'app-power-saving',
    templateUrl: 'power.saving.page.html',
    styleUrls: ['power.saving.page.scss'],
})
export class PowerSavingPage implements OnInit, OnDestroy {

    showImage = true;
    cache = true;

    constructor(private performanceService: PerformanceService) { }

    ngOnInit() { }

    ngOnDestroy() {
        this.performanceService.setCache(this.cache);
        this.performanceService.setShowImage(this.showImage);
    }


}
