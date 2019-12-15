import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone, AfterViewInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;


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

    constructor(private zone: NgZone) { }

    ngOnInit() {
        console.log('app-MiniCard ngOnInit');

    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.miniCardLoaded.emit('miniCardsLoaded');
        });
    }

    openUrl(url: string) {
        Browser.open({ url: url });
    }

    updateUrl($event, el) {
        const imgToFix = document.querySelectorAll('.slika')[el] as any;
        imgToFix.style.backgroundImage = `url('${this.brokenImageUrl}')`;
    }

    ngOnDestroy() {
        console.log('app-MiniCard ngOnDestroy');
    }
}
