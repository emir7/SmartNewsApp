import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class FontSizeService {
    headLineFontSize = new BehaviorSubject<number>(0);
    authorFontSize = new BehaviorSubject<number>(0);

    setHeadLineFontSize(value: number) {
        this.headLineFontSize.next(value);
    }

    getHeadlineFontSize() {
        return this.headLineFontSize.asObservable().pipe(
            map(x => {
                return x;
            })
        );
    }

    setAuthorFontSize(value: number) {
        this.authorFontSize.next(value);
    }

    getAuthorFontSize() {
        return this.authorFontSize.asObservable().pipe(
            map(x => {
                return x;
            })
        );
    }
}
