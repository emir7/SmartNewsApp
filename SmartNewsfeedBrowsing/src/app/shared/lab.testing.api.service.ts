import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class LabAPIService {

    constructor(private http: HttpClient) { }

    postData(username, predictionDATA) {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });

        this.http.post('http://163.172.169.249:9082/phase2/data', {
            username, predictionDATA
            , validID: 'idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj'
        }, { headers }).subscribe((res) => {
            console.log(res);
        }, (err) => {
            console.log('error while sending data for PHASE 2 server responded with');
            console.log(err);
        });
    }

}
