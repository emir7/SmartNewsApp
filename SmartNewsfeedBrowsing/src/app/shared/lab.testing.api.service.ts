import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class LabAPIService {

    constructor(private http: HttpClient) { }

    postData(username, phaseTwo) {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });

        this.http.post('http://93.103.215.63:9082/phase2/data', {
            username, phaseTwo
            , validID: 'idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj'
        }, { headers }).subscribe((res) => {
            console.log(res);
        }, (err) => {
            console.log('error while sending data for PHASE 2 server responded with');
            console.log(err);
        });
    }

    registerUser(username) {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });

        this.http.post('http://93.103.215.63:9082/user', {
            username
            , validID: 'idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj'
        }, { headers }).subscribe((res) => {
            console.log(res);
        }, (err) => {
            console.log('error while sending data for PHASE 2 server responded with');
            console.log(err);
        });
    }

}
