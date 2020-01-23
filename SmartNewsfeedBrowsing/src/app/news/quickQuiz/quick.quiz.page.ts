import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';

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
    }

    constructor(private modalController: ModalController) {

    }

    gChanged($event, el) {
        const prevIndex = this.quizObj[el].indexOf(true);
        if (prevIndex >= 0) {
            this.quizObj[el][prevIndex] = false;
        }
        const index = $event.detail.value.split('-')[2] % 5;
        this.quizObj[el][index] = true;
    }

    submit() {
        this.modalController.dismiss(this.quizObj);
    }
}