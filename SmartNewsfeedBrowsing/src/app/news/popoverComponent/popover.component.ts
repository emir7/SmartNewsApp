import { Component, OnInit, OnDestroy } from '@angular/core';
import { GoogleNewsApiService } from 'src/app/shared/google.news.api.service';
import { GagNewsApiService } from 'src/app/shared/gag.news.api.service';
import { PopoverController, LoadingController } from '@ionic/angular';

@Component({
    selector: 'app-popover',
    templateUrl: './popover.component.html',
    styleUrls: ['./popover.component.scss']
})

export class PopoverComponent implements OnInit, OnDestroy {


    constructor(
        private googleNewsApi: GoogleNewsApiService,
        private gagsApi: GagNewsApiService,
        private popoverController: PopoverController,
        private loadingController: LoadingController) { }

    ngOnInit() {
        console.log('PopoverComponent ngOnInit');
    }

    ngOnDestroy() {
        console.log('PopoverComponent ngOnDestroy');
    }

    search(category) {
        this.loadingController.create({
            message: 'Loading'
        }).then(loadingEl => {
            loadingEl.present();
            if (category === 'fun') {
                this.googleNewsApi.canSendHttpRequestOrStorage('topHeadlines' + category).then(res => {
                    if (typeof res === 'boolean') {
                        this.gagsApi.get9gagNews().subscribe(news => {
                            this.popoverController.dismiss({ news: news, category: category, cache: false });
                            loadingEl.dismiss();
                        }, err => {
                            console.log(err);
                            this.popoverController.dismiss({ error: true });
                            loadingEl.dismiss();
                        });
                    } else {
                        this.popoverController.dismiss({ news: res, category: category, cache: true });
                        loadingEl.dismiss();
                    }
                }).catch(err => {
                    console.log(err);
                    this.popoverController.dismiss({ error: true });
                    loadingEl.dismiss();
                });
            } else {
                this.googleNewsApi.canSendHttpRequestOrStorage('topHeadlines' + category).then(res => {
                    if (typeof res === 'boolean') {
                        this.googleNewsApi.searchWithCategory(category).subscribe(news => {
                            this.popoverController.dismiss({ news: news, category: category, cache: false });
                            loadingEl.dismiss();
                        }, err => {
                            console.log(err);
                            this.popoverController.dismiss({ error: true });
                            loadingEl.dismiss();
                        });
                    } else {
                        this.popoverController.dismiss({ news: res, category: category, cache: true });
                        loadingEl.dismiss();
                    }
                }).catch(err => {
                    console.log(err);
                    this.popoverController.dismiss({ error: true });
                });

            }
        });
    }


}
