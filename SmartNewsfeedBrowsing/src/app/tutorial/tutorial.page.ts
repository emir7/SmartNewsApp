import { OnInit, OnDestroy, Component, ViewChild } from '@angular/core';
import { IonSlides, IonInput } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { Plugins } from '@capacitor/core';

@Component({
    selector: 'app-tutorial',
    templateUrl: 'tutorial.page.html',
    styleUrls: ['tutorial.page.scss'],
})


export class TutorialPage implements OnInit, OnDestroy {

    @ViewChild('ionSlides', { static: false }) ionSlides: IonSlides;
    @ViewChild('username', { static: false }) username: IonInput;

    machineLearningPlugin = null;

    constructor(private storage: Storage, private router: Router) {
        const { MachineLearning } = Plugins;
        this.machineLearningPlugin = MachineLearning;
    }

    ngOnInit() {

        this.machineLearningPlugin.trainClf({
            firstTime: true
        }).then((data) => {
            console.log(data);
        }).catch((err) => {
            console.log('ERROR WHILE TRAINING CLASSIFIER');
            console.log(err);
        });
        console.log('TutorialPage ngOnInit');
    }

    ngOnDestroy() {
        console.log('TutorialPage ngOnDestroy');
    }

    next() {
        this.ionSlides.slideNext(500);
    }

    finish() {
        const user = {
            username: this.username.value,
            id: uuidv4()
        };

        this.storage.set('userInfo', user).then(() => {
            this.storage.set('tutorialComplete3', true).then(() => {
                this.router.navigateByUrl('/news');
            });
        });
    }

}
