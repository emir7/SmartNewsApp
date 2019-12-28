import { Component, OnInit, OnDestroy } from '@angular/core';
import { GoogleNewsApiService } from 'src/app/shared/google.news.api.service';
import { GagNewsApiService } from 'src/app/shared/gag.news.api.service';
import { PopoverController } from '@ionic/angular';

@Component({
    selector: 'app-popover',
    templateUrl: './popover.component.html',
    styleUrls: ['./popover.component.scss']
})

export class PopoverComponent implements OnInit, OnDestroy {


    constructor(
        private googleNewsApi: GoogleNewsApiService,
        private gagsApi: GagNewsApiService,
        private popoverController: PopoverController) { }

    ngOnInit() {
        console.log('PopoverComponent ngOnInit');
    }

    ngOnDestroy() {
        console.log('PopoverComponent ngOnDestroy');
    }

    search(category) {
        if (category === 'fun') {
            this.googleNewsApi.canSendHttpRequestOrStorage('topHeadlines' + category).then(res => {
                if (typeof res === 'boolean') {
                    this.gagsApi.get9gagNews().subscribe(news => {
                        console.log("=================================start0=========================================================");
                        console.log(news);
                        console.log("==================================eend0========================================================");
                        this.popoverController.dismiss({ news: news, category: category, cache: false });
                    }, err => {
                        console.log("=============================err0");
                        console.log(err);
                        this.popoverController.dismiss({ error: true });
                    });
                } else {
                    console.log("=================================start1=========================================================");
                    console.log(res);
                    console.log("==================================eend1========================================================");
                    this.popoverController.dismiss({ news: res, category: category, cache: true });
                }
            }).catch(err => {
                console.log("=============================err1");
                console.log(err);
                this.popoverController.dismiss({ error: true });
            });
        } else {
            this.googleNewsApi.canSendHttpRequestOrStorage('topHeadlines' + category).then(res => {
                if (typeof res === 'boolean') {
                    this.googleNewsApi.searchWithCategory(category).subscribe(news => {
                        this.popoverController.dismiss({ news: news, category: category, cache: false });
                    }, err => {
                        console.log(err);
                        this.popoverController.dismiss({ error: true });
                    });
                } else {
                    this.popoverController.dismiss({ news: res, category: category, cache: true });
                }
            }).catch(err => {
                console.log(err);
                this.popoverController.dismiss({ error: true });
            });

        }
    }


}
