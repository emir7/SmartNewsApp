import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { take } from 'rxjs/operators';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
    selector: "app-GridView",
    templateUrl: "./grid.view.component.html",
    styleUrls: ["./grid.view.component.scss"]
})

export class GridViewComponent implements OnInit, OnDestroy {

    @Input() arr;
    @Output() gridViewComponentLoaded = new EventEmitter<string>();

    constructor(private zone: NgZone, private iab: InAppBrowser) { }

    ngOnInit() {
        console.log("app-GridView ngOnInit");
    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.gridViewComponentLoaded.emit("gridViewLoaded");
        });
    }

    openUrl(url: string) {
        const browser = this.iab.create(url);
    }

    ngOnDestroy() {
        console.log("app-GridView ngOnDestroy");
    }

}