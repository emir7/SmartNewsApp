import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class GagNewsApiService {

    constructor(private http: HttpClient) { }

    get9gagNews() {
        return this.http.get<any>('http://93.103.215.63:9082/api/gag');
    }

}
