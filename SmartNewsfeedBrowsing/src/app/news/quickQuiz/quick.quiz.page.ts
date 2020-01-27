import { Component, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'quick-quiz-page',
    templateUrl: 'quick.quiz.html',
    styleUrls: ['quick.quiz.scss']
})

export class QuickQuizModalPage {

    @ViewChild('pText', null) pText: ElementRef;
    @ViewChild('rText', null) rText: ElementRef;
    @ViewChild('iText', null) iText: ElementRef;


    quizObj = {
        p: [false, false, false, false, false],
        r: [false, false, false, false, false],
        i: [false, false, false, false, false]
    };

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
        const pIndex = this.quizObj.p.indexOf(true);
        let missingInput = false;

        this.pText.nativeElement.style.color = 'black';
        this.rText.nativeElement.style.color = 'black';
        this.iText.nativeElement.style.color = 'black';

        if (pIndex < 0) {
            missingInput = true;
            this.pText.nativeElement.style.color = 'red';
            return;
        }

        const rIndex = this.quizObj.r.indexOf(true);
        if (rIndex < 0) {
            missingInput = true;
            this.rText.nativeElement.style.color = 'red';
            return;
        }

        const iIndex = this.quizObj.i.indexOf(true);
        if (iIndex < 0) {
            missingInput = true;
            this.iText.nativeElement.style.color = 'red';
            return;
        }

        if (!missingInput) {
            this.modalController.dismiss({ p: pIndex - 2, r: rIndex - 2, i: iIndex - 2 });
        }

    }

    cancel() {
        this.modalController.dismiss();
    }
}
