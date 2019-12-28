import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class GagNewsApiService {

    constructor(private http: HttpClient) { }

    get9gagNews() {
        return this.http.get<any>('http://89.212.33.56:8080/api/gag');
    }

}
