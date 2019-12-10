import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { take } from 'rxjs/operators';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
    selector: "app-LargeCard",
    templateUrl: "./large.card.component.html",
    styleUrls: ["./large.card.component.scss"]
})

export class LargeCardComponent implements OnInit, OnDestroy {

    constructor(private zone: NgZone, public iab: InAppBrowser) { }

    @Input() arr;
    @Output() largeCardLoaded = new EventEmitter<string>();

    ngOnDestroy() {
        console.log("app-LargeCard ngOnDestroy");
    }

    ngOnInit() {
        console.log("app-LargeCard ngOnInit");
    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.largeCardLoaded.emit("largeCardsLoaded");
        });
    }

    openUrl(url: string) {
        const browser = this.iab.create(url);
    }

}
