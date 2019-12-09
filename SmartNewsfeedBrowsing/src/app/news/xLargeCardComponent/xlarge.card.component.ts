import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';

@Component({
    selector: "app-XLargeCard",
    templateUrl: "./xlarge.card.component.html",
    styleUrls: ["./xlarge.card.component.scss"]
})

export class XLargeCardComponent implements OnInit, OnDestroy {

    @Input() arr;
    @Output() xLargeCardsLoaded = new EventEmitter<string>();

    ngOnDestroy() {
        console.log("ngOnDestroy");
    }

    ngOnInit() {
        console.log("ngOnInit");
    }

    ngAfterContentInit() {
        console.log("eo me tle");
        setTimeout(() => {
            this.xLargeCardsLoaded.emit("xLargeCardsLoaded");
        }, 500);
    }
}