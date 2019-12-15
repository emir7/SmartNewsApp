import { Component, OnInit, OnDestroy, Input, EventEmitter, Output, NgZone, ViewChild, AfterViewInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { IonSlides } from '@ionic/angular';
import { IndexSlideService } from 'src/app/shared/index.slide.service';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;

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
    brokenImageUrl = 'assets/noImg.jpg';

    constructor(private zone: NgZone, public indexSlideService: IndexSlideService) { }

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
        Browser.open({ url: url });
    }

    updateUrl($event, el) {
        document.querySelectorAll('img')[el].src = this.brokenImageUrl;
    }

    ngOnDestroy() {
        console.log('ngOnDestroy');
    }
}
