import { OnInit, OnDestroy, Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FontSizeService } from 'src/app/shared/font.service';
import { Storage } from '@ionic/storage';

@Component({
    selector: 'app-customize-text',
    templateUrl: 'customize.text.page.html',
    styleUrls: ['customize.text.page.scss'],
})
export class CustomizeTextPage implements OnInit, OnDestroy {
    @ViewChild('authorExample', { static: false }) authorExample: any;
    @ViewChild('descriptionExample', { static: false }) descriptionExample: any;

    authorSize = 12 + (30 - 12) * ((window.innerWidth - 300) / (1600 - 300));
    headlineSize = this.authorSize;

    minSize = this.authorSize;

    constructor(public fontSizeService: FontSizeService, private storage: Storage, private changeDetector: ChangeDetectorRef) {

    }

    ngOnInit() {
        this.storage.get('authorSize').then((val) => {
            if (typeof val !== 'number') {
                this.authorSize = this.minSize;
            } else {
                this.authorSize = val;
                this.fontSizeService.setHeadLineFontSize(val);
            }
            this.changeDetector.detectChanges();
        });

        this.storage.get('headlineSize').then((val) => {
            if (typeof val !== 'number') {
                this.headlineSize = this.minSize;
            } else {
                this.headlineSize = val;
                this.fontSizeService.setHeadLineFontSize(val);
            }
            this.changeDetector.detectChanges();
        });

    }

    ngOnDestroy() {
        this.fontSizeService.setAuthorFontSize(this.authorSize);
        this.fontSizeService.setHeadLineFontSize(this.headlineSize);
        this.storage.set('authorSize', this.authorSize);
        this.storage.set('headlineSize', this.headlineSize);
    }

}
