import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { take } from 'rxjs/operators';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';


@Component({
    selector: "app-MiniCard",
    templateUrl: "./mini.card.component.html",
    styleUrls: ["./mini.card.component.scss"]
})

export class MiniCardComponent implements OnInit, OnDestroy {

    constructor(private zone: NgZone, public iab: InAppBrowser) { }

    @Input() arr;
    @Output() miniCardLoaded = new EventEmitter<string>();


    ngOnInit() {
        console.log("app-MiniCard ngOnInit");

    }

    ngAfterViewInit() {
        console.log("eo me app-MiniCard");
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            console.log("eo m2 app-MiniCard");
            this.miniCardLoaded.emit("miniCardsLoaded");
        });
    }

    openUrl(url: string) {
        const browser = this.iab.create(url);
    }

    ngOnDestroy() {
        console.log("app-MiniCard ngOnDestroy");
    }
}
