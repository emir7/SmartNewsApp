import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PerformanceService {
    showImage = new BehaviorSubject<boolean>(true);
    cache = new BehaviorSubject<boolean>(true);

    setShowImage(value: boolean) {
        this.showImage.next(value);
    }

    getShowImage() {
        return this.showImage.asObservable().pipe(
            map(x => {
                return x;
            })
        );
    }

    setCache(value: boolean) {
        this.cache.next(value);
    }

    getCache() {
        return this.cache.asObservable().pipe(
            map(x => {
                return x;
            })
        );
    }
}
