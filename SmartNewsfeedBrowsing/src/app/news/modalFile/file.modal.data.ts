import { Component, Input } from '@angular/core';
import { NavParams } from '@ionic/angular';

@Component({
    selector: 'modal-data',
    templateUrl: 'modal.file.html',
    styleUrls: ['modal.file.scss']
})
export class FileModal {

    @Input() fileData: string;

    constructor(navParams: NavParams) {
        console.log(navParams.get('fileData'));
    }

}