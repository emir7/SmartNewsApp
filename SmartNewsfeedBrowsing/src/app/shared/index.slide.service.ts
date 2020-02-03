import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class IndexSlideService {
    private indexToGoBack = new BehaviorSubject<number>(0);

    getIndexToGoBack() {
        return this.indexToGoBack.asObservable();
    }

    setIndexToGoBack(index) {
        this.indexToGoBack.next(index);
    }
}
