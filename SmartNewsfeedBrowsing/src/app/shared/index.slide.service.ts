import { Injectable } from '@angular/core';

@Injectable()
export class IndexSlideService {
    private indexToGoBack = 0;

    getIndexToGoBack() {
        return this.indexToGoBack;
    }

    setIndexToGoBack(index) {
        this.indexToGoBack = index;
    }
}
