import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: "app-LargeCard",
    templateUrl: "./large.card.component.html",
    styleUrls: ["./large.card.component.scss"]
})

export class LargeCardComponent implements OnInit, OnDestroy {

    @Input() arr;
    @Output() largeCardLoaded = new EventEmitter<string>();

    ngOnDestroy() {
        console.log("app-LargeCard ngOnDestroy");
    }

    ngOnInit() {
        console.log("app-LargeCard ngOnInit");
    }

    ngAfterContentInit() {
        console.log("eo me tle");
        this.largeCardLoaded.emit("largeCardsLoaded");
    }
}