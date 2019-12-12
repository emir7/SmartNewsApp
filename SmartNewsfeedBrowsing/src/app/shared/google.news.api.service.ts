import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { Plugins, PluginListenerHandle } from '@capacitor/core';
import { PerformanceService } from './performance.service';

const { Network } = Plugins;

@Injectable()
export class GoogleNewsApiService {

    constructor(private http: HttpClient, private storage: Storage, private performanceService: PerformanceService) {

    }

    private apiKey = "cc5c7c95c27a4b1890f1bd224ef9a2db";
    private apiUrl = "https://newsapi.org/v2";

    getTopHeadlines() {
        return this.http.get<any>(`${this.apiUrl}/top-headlines/?sources=google-news&apiKey=${this.apiKey}`);
    }

    canSendHttpRequestOrStorage(q) {
        let b = null;
        return Network.getStatus()
            .then(internetStatus => {
                if (internetStatus && internetStatus.connected) {
                    return true;
                }
                return false;
            }).then(connectedToInternet => {
                b = connectedToInternet;
                return this.storage.get(q);
            }).then(obj => {
                if (b && obj != null) { // ce imas internet in imas cache potem preveris starost cachea
                    const currentDate = new Date();
                    const timeDiff = (currentDate.getTime() - new Date(obj.d).getTime()) / 1000;
                    if (timeDiff > 1 * 60) { // ce so podatki stari vec kot minuto jih requestas sicer ne
                        return true;
                    }
                    return obj;
                }

                if (!b && obj == null) { // ce nimas internata in nimas cachea
                    throw new Error('No data to return => no internet and no cache');
                }

                if (!b && obj != null) { // ce nimas interneta ampak mas pa cache
                    return obj;
                }

                if (b && obj == null) { // ce mas internet in nimas cachea
                    return true;
                }

                throw new Error('Something went wrong');

            });
    }

    getInternetStatus() {
        return Network.getStatus()
            .then(internetStatus => {
                if (internetStatus && internetStatus.connected) {
                    return true;
                }
                return false;
            });
    }

    storeNews(key, arr, d) {
        this.performanceService.getCache().subscribe(cacheB => {
            console.log("cacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheBcacheB");
            console.log(cacheB)
            if (cacheB) {
                this.storage.set(key, { n: arr, d: d });
            }
        });
    }

    getCustomNews(q) {
        if (q && q.length > 0) {
            return this.http.get<any>(`${this.apiUrl}/everything?q=${q}&apiKey=${this.apiKey}`)
        } else {
            return this.getTopHeadlines();
        }
    }
}
