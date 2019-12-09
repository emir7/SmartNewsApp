import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: "app-MiniCard",
    templateUrl: "./mini.card.component.html",
    styleUrls: ["./mini.card.component.scss"]
})

export class MiniCardComponent implements OnInit, OnDestroy {

    @Input() arr;
    @Output() miniCardLoaded = new EventEmitter<string>();

    ngOnDestroy() {
        console.log("app-MiniCard ngOnDestroy");
    }

    ngOnInit() {
        console.log("app-MiniCard ngOnInit");

    }

    ngAfterContentInit() {
        console.log("eo me tle");
        this.miniCardLoaded.emit("miniCardsLoaded");
    }

}