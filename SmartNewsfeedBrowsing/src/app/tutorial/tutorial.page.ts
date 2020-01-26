import { OnInit, OnDestroy, Component, ViewChild } from '@angular/core';
import { IonSlides } from '@ionic/angular';

@Component({
    selector: 'app-tutorial',
    templateUrl: 'tutorial.page.html',
    styleUrls: ['tutorial.page.scss'],
})

export class TutorialPage implements OnInit, OnDestroy {

    @ViewChild('ionSlides', { static: false }) ionSlides: IonSlides;

    ngOnInit() {
        console.log('TutorialPage ngOnInit');
    }

    ngOnDestroy() {
        console.log('TutorialPage ngOnDestroy');
    }

    next() {
        this.ionSlides.slideNext(500);
    }

    finish() {

    }

}
