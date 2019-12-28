import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';

const { UsersPARecognition } = Plugins;

@Injectable()
export class SensorReadingService {
    userActivityTypeArr = new BehaviorSubject<number[]>([]);
    userActivityTypeProbArr = new BehaviorSubject<number[]>([]);

    userPARecognition = null;

    constructor() {
        this.userPARecognition = UsersPARecognition;
        this.userPARecognition.startTrackingUserActivity();

        this.userPARecognition.addListener('userPhysicalActivity', (data) => {
            console.log('Data is here !!!');
            console.log(data);
            this.setUserActivityTypeArr(data.types);
            this.setUserActivityTypeProbArr(data.probs);
        });

    }

    setUserActivityTypeArr(values) {
        console.log('setUserActivityTypeArr');
        console.log(values);
        this.userActivityTypeArr.next([...values]);
    }

    setUserActivityTypeProbArr(values) {
        console.log('setUserActivityTypeProbArr');
        console.log(values);
        this.userActivityTypeProbArr.next([...values]);
    }

    getUserActivityTypeArr() {
        return this.userActivityTypeArr.asObservable();
    }

    geUserActivityTypeProbArr() {
        return this.userActivityTypeProbArr.asObservable();
    }

}

