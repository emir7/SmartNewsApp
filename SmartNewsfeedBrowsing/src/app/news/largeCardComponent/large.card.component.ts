import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { take } from 'rxjs/operators';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
    selector: 'app-LargeCard',
    templateUrl: './large.card.component.html',
    styleUrls: ['./large.card.component.scss']
})

export class LargeCardComponent implements OnInit, OnDestroy, AfterViewInit {

    brokenImageUrl = 'https://s3.amazonaws.com/focus-misc-assets/image_not_available_829x455.jpg';

    @Input() arr;
    @Input() authorFontSize;
    @Input() headlinesFontSize;
    @Input() showImages;
    @Output() largeCardLoaded = new EventEmitter<string>();

    constructor(private zone: NgZone, public iab: InAppBrowser) { }

    ngOnInit() {
        console.log('app-LargeCard ngOnInit');
    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.largeCardLoaded.emit('largeCardsLoaded');
        });
    }

    updateUrl($event, el) {
        document.querySelectorAll('img')[el].src = this.brokenImageUrl;
    }

    openUrl(url: string) {
        const browser = this.iab.create(url);
    }

    ngOnDestroy() {
        console.log('app-LargeCard ngOnDestroy');
    }
    /*
    changeDet() {
        console.log(this.authorFontSize);
        console.log(this.headlinesFontSize);
        this.authorFontSize = 18;
        this.headlinesFontSize = 18;
        this.changeDetector.detectChanges();
    }*/

}
