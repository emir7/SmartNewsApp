import { OnInit, OnDestroy, Component, ViewChild } from '@angular/core';
import { FontSizeService } from 'src/app/shared/font.service';

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

    constructor(public fontSizeService: FontSizeService) {

    }

    ngOnInit() { }

    ngOnDestroy() {
        this.fontSizeService.setAuthorFontSize(this.authorSize);
        this.fontSizeService.setHeadLineFontSize(this.headlineSize);
    }

}
