import { OnInit, OnDestroy, Component } from '@angular/core';
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

    ionSlides = null;
    userData = '';
    machineLearningPlugin = null;

    uuidData = '';

    constructor(private storage: Storage, private router: Router) {
        const { MachineLearning } = Plugins;
        this.machineLearningPlugin = MachineLearning;
    }

    usernameBlured() {
        if (this.userData.length > 0) {
            const transformedUsername = this.userData.replace(/[^a-z0-9]+/gi, '');
            this.ionSlides.lockSwipeToNext(false)
                .then(() => {
                    return this.storeUserData(transformedUsername);
                }).then(() => {
                    return this.machineLearningPlugin.trainClf({
                        username: transformedUsername + this.uuidData,
                        firstTime: true
                    });
                }).then((mlReturn) => {
                    console.log(mlReturn);
                }).then(() => {
                    this.storage.set('dateOfInstall', new Date().getTime());
                    this.storage.set('selectedModel', -1);
                }).catch(err => {
                    console.log('there was an error while training first time');
                    console.log(err);
                });

        }
    }

    ngOnInit() {
        this.ionSlides = document.querySelector('ion-slides');
        this.ionSlides.lockSwipeToNext(true);
    }

    ngOnDestroy() {
        console.log('TutorialPage ngOnDestroy');
    }

    next() {
        this.ionSlides.slideNext(500);
    }

    finish() {
        this.router.navigateByUrl('/news');
    }

    storeUserData(username) {
        this.uuidData = uuidv4();
        const user = {
            username,
            id: this.uuidData
        };

        return this.storage.set('userInfo', user).then(() => {
            return this.storage.set('tutorialComplete7', true);
        });
    }

}
