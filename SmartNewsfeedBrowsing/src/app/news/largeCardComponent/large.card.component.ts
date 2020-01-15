import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { take } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';
const { CustomChromeBrowser } = Plugins;
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
    @Output() inBrowser = new EventEmitter<string>();

    constructor(private zone: NgZone) { }

    ngOnInit() {
        console.log(this.arr);
        console.log('ngOnInit');
    }

    ionViewDidEnter() {
        console.log('ionViewDidEnter');
    }


    ngAfterViewInit() {
        console.log('ngAfterViewInit');
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.largeCardLoaded.emit('largeCardsLoaded');
        });
    }

    updateUrl($event, el) {
        const imgElement = document.querySelectorAll('.card img')[el] as HTMLImageElement;
        imgElement.src = this.brokenImageUrl;
    }

    openUrl(url: string) {
        CustomChromeBrowser.open({ url });
        CustomChromeBrowser.addListener('browserClosed', () => {
            this.inBrowser.emit('outBrowser');
        });
        this.inBrowser.emit('inBrowser');
    }

    ngOnDestroy() {
        console.log('app-LargeCard ngOnDestroy');
    }

}
