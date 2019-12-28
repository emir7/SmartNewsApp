import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { take } from 'rxjs/operators';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;

@Component({
    selector: 'app-LargeCard',
    templateUrl: './large.card.component.html',
    styleUrls: ['./large.card.component.scss']
})

export class LargeCardComponent implements OnInit, OnDestroy, AfterViewInit {

    brokenImageUrl = 'assets/noImg.jpg';

    @Input() arr;
    @Input() authorFontSize;
    @Input() headlinesFontSize;
    @Input() showImages;
    @Output() largeCardLoaded = new EventEmitter<string>();

    constructor(private zone: NgZone) { }

    ngOnInit() {
        console.log(this.arr);
    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.largeCardLoaded.emit('largeCardsLoaded');
        });
    }

    updateUrl($event, el) {
        const imgElement = document.querySelectorAll('.card img')[el] as HTMLImageElement;
        imgElement.src = this.brokenImageUrl;
    }

    openUrl(url: string) {
        Browser.open({ url: url });
    }

    ngOnDestroy() {
        console.log('app-LargeCard ngOnDestroy');
    }

}
