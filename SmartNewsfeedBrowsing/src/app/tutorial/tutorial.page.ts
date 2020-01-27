import { OnInit, OnDestroy, Component, ViewChild } from '@angular/core';
import { IonSlides } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';

@Component({
    selector: 'app-tutorial',
    templateUrl: 'tutorial.page.html',
    styleUrls: ['tutorial.page.scss'],
})

export class TutorialPage implements OnInit, OnDestroy {

    @ViewChild('ionSlides', { static: false }) ionSlides: IonSlides;

    constructor(private storage: Storage, private router: Router) {

    }

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
        this.storage.set('tutorialComplete', true).then(() => {
            this.router.navigateByUrl('/news');
        });
    }

}
