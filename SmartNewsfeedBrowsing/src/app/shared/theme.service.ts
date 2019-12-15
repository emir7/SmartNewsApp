import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ThemeService {

    constructor() { }

    currentTheme = new BehaviorSubject<string>('light-theme');

    setTheme(value: string) {
        this.currentTheme.next(value);
    }

    getTheme() {
        return this.currentTheme.asObservable().pipe(
            map(x => {
                return x;
            })
        );
    }
}
