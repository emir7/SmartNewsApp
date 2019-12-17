import { OnInit, OnDestroy, Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PerformanceService } from '../shared/performance.service';

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.page.html',
    styleUrls: ['settings.page.scss'],
})

export class SettingsPage implements OnInit, OnDestroy {

    showImage: boolean;
    cache: boolean;

    constructor(private storage: Storage, private performanceService: PerformanceService) {
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
                this.performanceService.setShowImage(val);
            }
        });

    }

    ngOnInit() {
        console.log('SettingsPage ngOnInit');
    }

    ngOnDestroy() {
        console.log('SettingsPage ngOnDestroy');
    }

}
