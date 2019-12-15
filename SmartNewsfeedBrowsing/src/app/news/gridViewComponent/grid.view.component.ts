import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone, AfterViewInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;

@Component({
    selector: 'app-GridView',
    templateUrl: './grid.view.component.html',
    styleUrls: ['./grid.view.component.scss']
})


export class GridViewComponent implements OnInit, OnDestroy, AfterViewInit {

    @Input() arr;
    @Input() authorFontSize;
    @Input() headlinesFontSize;
    @Output() gridViewComponentLoaded = new EventEmitter<string>();
    brokenImageUrl = 'assets/noImg.jpg';

    constructor(private zone: NgZone) { }

    ngOnInit() {
        console.log('app-GridView ngOnInit');
    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.gridViewComponentLoaded.emit('gridViewLoaded');
        });
    }

    openUrl(url: string) {
        Browser.open({ url: url });
    }

    updateUrl($event, el) {
        const imgToFix = document.querySelectorAll('.image-container')[el] as any;
        imgToFix.style.backgroundImage = `url('${this.brokenImageUrl}')`;
    }

    ngOnDestroy() {
        console.log('app-GridView ngOnDestroy');
    }

}
