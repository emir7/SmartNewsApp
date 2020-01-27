import { Component } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';

@Component({
    selector: 'quick-quiz-page',
    templateUrl: 'quick.quiz.html',
    styleUrls: ['quick.quiz.scss']
})

export class QuickQuizModalPage {

    quizObj = {
        p: [false, false, false, false, false],
        r: [false, false, false, false, false],
        i: [false, false, false, false, false]
    };

    constructor(private modalController: ModalController, public alertController: AlertController, ) { }

    gChanged($event, el) {
        const prevIndex = this.quizObj[el].indexOf(true);
        if (prevIndex >= 0) {
            this.quizObj[el][prevIndex] = false;
        }
        const index = $event.detail.value.split('-')[2] % 5;
        this.quizObj[el][index] = true;
    }

    submit() {
        const pIndex = this.quizObj.p.indexOf(true);
        let missingInput = false;

        document.getElementById('preference-text').style.color = 'black';
        document.getElementById('readability-text').style.color = 'black';
        document.getElementById('informativness-text').style.color = 'black';

        if (pIndex < 0) {
            missingInput = true;
            document.getElementById('preference-text').style.color = 'red';
        }

        const rIndex = this.quizObj.r.indexOf(true);
        if (rIndex < 0) {
            missingInput = true;
            document.getElementById('readability-text').style.color = 'red';
        }

        const iIndex = this.quizObj.i.indexOf(true);
        if (iIndex < 0) {
            missingInput = true;
            document.getElementById('informativness-text').style.color = 'red';
        }

        if (!missingInput) {
            this.modalController.dismiss({ p: pIndex - 2, r: rIndex - 2, i: iIndex - 2 });
        }

    }

    cancel() {
        this.alertController.create({
            header: 'Skip feedback',
            message: 'Are you sure you dont want to answer?',
            buttons: [
                {
                    text: 'No'
                },
                {
                    text: 'Yes',
                    handler: () => {
                        this.modalController.dismiss();
                    }
                },
            ]
        }).then(alertEl => {
            alertEl.present();
        });
    }
}
