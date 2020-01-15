import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone, AfterViewInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';

const { Browser } = Plugins;
const { CustomChromeBrowser } = Plugins;

@Component({
    selector: 'app-MiniCard',
    templateUrl: './mini.card.component.html',
    styleUrls: ['./mini.card.component.scss']
})

export class MiniCardComponent implements OnInit, OnDestroy, AfterViewInit {

    brokenImageUrl = 'assets/noImg.jpg';

    @Input() arr;
    @Input() authorFontSize;
    @Input() headlinesFontSize;
    @Input() showImages;
    @Output() miniCardLoaded = new EventEmitter<string>();
    @Output() inBrowser = new EventEmitter<string>();

    constructor(private zone: NgZone) { }

    ngOnInit() {
        console.log('app-MiniCard ngOnInit');
    }

    ngAfterViewInit() {
        console.log('ngAfterViewInit');
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.miniCardLoaded.emit('miniCardsLoaded');
        });
    }

    ionViewDidEnter() {
        console.log('ionViewDidEnter');
    }

    openUrl(url: string) {
        CustomChromeBrowser.open({ url });
        CustomChromeBrowser.addListener('browserClosed', () => {
            this.inBrowser.emit('outBrowser');
        });
        this.inBrowser.emit('inBrowser');
    }

    updateUrl($event, el) {
        const imgToFix = document.querySelectorAll('.slika')[el] as any;
        imgToFix.style.backgroundImage = `url('${this.brokenImageUrl}')`;
    }

    ngOnDestroy() {
        console.log('app-MiniCard ngOnDestroy');
    }
}
