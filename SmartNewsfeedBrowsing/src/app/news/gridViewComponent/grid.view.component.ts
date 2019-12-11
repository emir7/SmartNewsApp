import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone, AfterViewInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
    selector: 'app-GridView',
    templateUrl: './grid.view.component.html',
    styleUrls: ['./grid.view.component.scss']
})

export class GridViewComponent implements OnInit, OnDestroy, AfterViewInit {

    @Input() arr;
    @Input() authorFontSize;
    @Input() headlinesFontSize;
    @Output() gridViewComponentLoaded = new EventEmitter<string>();
    brokenImageUrl = 'https://s3.amazonaws.com/focus-misc-assets/image_not_available_829x455.jpg';

    constructor(private zone: NgZone, private iab: InAppBrowser) { }

    ngOnInit() {
        console.log('app-GridView ngOnInit');
    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.gridViewComponentLoaded.emit('gridViewLoaded');
        });
    }

    openUrl(url: string) {
        const browser = this.iab.create(url);
    }

    updateUrl($event, el) {
        const imgToFix = document.querySelectorAll('.image-container')[el] as any;
        imgToFix.style.backgroundImage = `url('${this.brokenImageUrl}')`;
    }

    ngOnDestroy() {
        console.log('app-GridView ngOnDestroy');
    }

}
