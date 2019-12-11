import { Component, OnInit, OnDestroy, Input, EventEmitter, Output, NgZone, ViewChild, AfterViewInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { IonSlides } from '@ionic/angular';
import { IndexSlideService } from 'src/app/shared/index.slide.service';

@Component({
    selector: 'app-XLargeCard',
    templateUrl: './xlarge.card.component.html',
    styleUrls: ['./xlarge.card.component.scss']
})

export class XLargeCardComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChild('ionSlides', { static: false }) ionSlides: IonSlides;

    @Input() arr;
    @Input() authorFontSize;
    @Input() headlinesFontSize;
    @Input() showImages;
    @Output() xLargeCardsLoaded = new EventEmitter<string>();
    brokenImageUrl = 'https://s3.amazonaws.com/focus-misc-assets/image_not_available_829x455.jpg';

    constructor(private zone: NgZone, public iab: InAppBrowser, public indexSlideService: IndexSlideService) { }

    ngOnInit() {
        console.log('ngOnInit');
    }

    ngAfterViewInit() {
        this.zone.onMicrotaskEmpty.asObservable().pipe(take(1)).subscribe(() => {
            this.xLargeCardsLoaded.emit('xLargeCardsLoaded');
        });
    }

    onSlideChange() {
        this.ionSlides.getActiveIndex()
            .then(index => {
                this.indexSlideService.setIndexToGoBack(index);
            });
    }
    openUrl(url: string) {
        const browser = this.iab.create(url);
    }

    updateUrl($event, el) {
        document.querySelectorAll('img')[el].src = this.brokenImageUrl;
    }

    ngOnDestroy() {
        console.log('ngOnDestroy');
    }
}
