import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { take } from 'rxjs/operators';

@Injectable()
export class ActionCounterService {
    actionCounter = new BehaviorSubject<number>(0);

    constructor(private storage: Storage) {
        this.storage.get('actionCounter').then((val) => {
            if (val == null) {
                this.setActionCounter(0);
                return;
            }
            this.actionCounter.next(val);
        });
    }

    addAction() {
        this.actionCounter.pipe(take(1)).subscribe(value => {
            value++;
            this.setActionCounter(value);
        });
    }

    setActionCounter(val) {
        if (val < 26) {
            this.storage.set('actionCounter', val).then(() => {
                this.actionCounter.next(val);
            });
        }
    }

    getActionCounter() {
        return this.actionCounter.asObservable();
    }
}
