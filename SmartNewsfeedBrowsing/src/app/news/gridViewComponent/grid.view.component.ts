import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone, AfterViewInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

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
    @Output() inBrowser = new EventEmitter<string>();
    @Output() outsideBrowser = new EventEmitter<string>();

    brokenImageUrl = 'assets/noImg.jpg';

    constructor(private zone: NgZone, private iab: InAppBrowser) { }

    ngOnInit() {
        console.log('app-GridView ngOnInit');
        console.log('ngOnInit');

    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.gridViewComponentLoaded.emit('gridViewLoaded');
        });
        console.log('ngAfterViewInit');

    }

    ionViewDidEnter() {
        console.log('ionViewDidEnter');
    }

    openUrl(url: string) {
        const browser = this.iab.create(url);
        browser.on('exit').subscribe((event) => {
            this.inBrowser.emit('outBrowser');

        });
        this.inBrowser.emit('inBrowser');
    }

    updateUrl($event, el) {
        const imgToFix = document.querySelectorAll('.image-container')[el] as any;
        imgToFix.style.backgroundImage = `url('${this.brokenImageUrl}')`;
    }

    ngOnDestroy() {
        console.log('app-GridView ngOnDestroy');
    }

}
