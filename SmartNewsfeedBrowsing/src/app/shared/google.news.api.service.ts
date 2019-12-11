import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class GoogleNewsApiService {

    constructor(private http: HttpClient) { }

    private apiKey = "cc5c7c95c27a4b1890f1bd224ef9a2db";
    private apiUrl = "https://newsapi.org/v2";

    getTopHeadlines() {
        return this.http.get<any>(`${this.apiUrl}/top-headlines/?sources=google-news&apiKey=${this.apiKey}`);
    }

    getCustomNews(q) {
        if (q && q.length > 0) {
            return this.http.get<any>(`${this.apiUrl}/everything?q=${q}&apiKey=${this.apiKey}`)
        } else {
            return this.getTopHeadlines();
        }
    }
}
