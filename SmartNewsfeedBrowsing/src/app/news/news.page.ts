import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, IonSlides } from '@ionic/angular';
import { GoogleNewsApiService } from '../shared/google.news.api.service';
import { IndexSlideService } from '../shared/index.slide.service';

@Component({
    selector: 'app-news',
    templateUrl: 'news.page.html',
    styleUrls: ['news.page.scss'],
})
export class NewsPage implements OnInit, OnDestroy {

    currentViewLayout = 'largeCards';
    arr = [];
    currentVisibleElement = 0;
    canWatchScroll = true;

    title = 'Top Headlines';
    noImageUrl = 'https://s3.amazonaws.com/focus-misc-assets/image_not_available_829x455.jpg';
    searchQuery = '';

    constructor(public loadingController: LoadingController, public googleNewsApi: GoogleNewsApiService, public indexSlideService: IndexSlideService) { }

    ngOnInit() {
        this.displayLoadingElement()
            .then(loadingEl => {
                loadingEl.present();
                document.getElementById('content').style.display = 'none';
                this.googleNewsApi.getTopHeadlines().subscribe(res => {
                    this.setupNewsFeedArray(res);
                    loadingEl.dismiss();
                    document.getElementById('content').style.display = 'block';
                });
            });
    }

    displayLoadingElement() {
        return this.loadingController.create({
            message: 'Loading...',
        });
    }

    onContentScroll() {
        if (this.canWatchScroll && this.currentViewLayout !== "xLargeCards") {
            const elements = document.querySelectorAll('.activeList .card');
            console.log("hihihi spreminjam index...");
            for (let i = 0; i < elements.length; i++) {
                const rect = elements[i].getBoundingClientRect() as DOMRect;
                if (rect.y > 0) {
                    this.currentVisibleElement = i;
                    console.log(i);
                    break;
                }
            }
        }
    }

    nekTimeout() {
        return new Promise((resolve, _) => {
            setTimeout(resolve, 500);
        });
    }

    showLoadingElementFor(ms) {
        return this.loadingController.create({
            message: 'Loading...',
            duration: ms
        }).then(loadingEl => {
            loadingEl.present();
            return loadingEl.onDidDismiss();
        });
    }

    viewIsLoaded($event) {
        if ($event === 'miniCardsLoaded' || $event === 'largeCardsLoaded') {
            this.canWatchScroll = false; // IMPORTANT
            this.showLoadingElementFor(500)
                .then(() => {
                    this.scrollToElement()
                        .then(() => {
                            document.getElementById('content').style.overflow = 'hidden';
                            setTimeout(() => {
                                this.canWatchScroll = true;
                                document.getElementById('content').style.overflow = 'scroll';
                            }, 200);
                        });
                });
        } else if ($event === 'xLargeCardsLoaded') {
            this.canWatchScroll = false;
            const ionSlider = document.querySelector('.activeList .slides') as any;
            this.showLoadingElementFor(500)
                .then(() => {
                    console.log("potujem do elementa ... " + this.currentVisibleElement);
                    ionSlider.slideTo(this.currentVisibleElement, 100)
                        .then(() => {
                            return this.nekTimeout();
                        }).then(() => {
                            document.getElementById('content').style.display = 'block';
                            document.getElementById('content').style.overflow = 'hidden';
                            setTimeout(() => {
                                this.canWatchScroll = true;
                                document.getElementById('content').style.overflow = 'scroll';
                            }, 200);
                        });

                });
        } else if ($event === 'gridViewLoaded') {
            this.canWatchScroll = false; // IMPORTANT
            document.getElementById('content').style.display = 'none';
            this.showLoadingElementFor(500)
                .then(() => {
                    this.scrollToElement(true)
                        .then(() => {
                            document.getElementById('content').style.overflow = 'hidden';
                            setTimeout(() => {
                                this.canWatchScroll = true;
                                document.getElementById('content').style.overflow = 'scroll';
                                document.getElementById('content').style.display = 'block';
                            }, 200);
                        });
                });
        }
    }

    scrollToElement(gridView = false) {
        document.getElementById('content').style.display = 'block';
        const ionContent = document.querySelector('#content') as any;
        const elements = document.querySelectorAll('.activeList .card') as any;

        if (elements[this.currentVisibleElement]) {
            if (gridView) {
                return ionContent.scrollToPoint(0, elements[this.currentVisibleElement].offsetTop - 200, 100);
            } else {
                return ionContent.scrollToPoint(0, elements[this.currentVisibleElement].offsetTop, 100);
            }
        } else {
            return Promise.resolve();
        }
    }

    additionalTimeoutForViewSetup() {
        return new Promise((resolve, _) => {
            setTimeout(resolve, 500);
        });
    }

    search($event) {
        console.log($event);
        console.log("searchQuery = " + this.searchQuery);
        this.displayLoadingElement()
            .then(loadingEl => {
                loadingEl.present();
                document.getElementById('content').style.display = 'none';

                let httpRequestToPreform = null;

                if ($event === "default") {
                    httpRequestToPreform = this.googleNewsApi.getTopHeadlines();
                    this.searchQuery = '';
                } else {
                    httpRequestToPreform = this.googleNewsApi.getCustomNews(this.searchQuery);
                }

                httpRequestToPreform.subscribe(res => {
                    this.setupNewsFeedArray(res);
                    this.additionalTimeoutForViewSetup()
                        .then(() => {
                            return this.scrollToTop();
                        }).then(() => {
                            loadingEl.dismiss();
                            document.getElementById('content').style.display = 'block';
                            this.title = this.searchQuery;
                            if ($event === 'default') {
                                this.title = 'Top Headlines';
                            }
                        });
                });
            });
    }

    scrollToTop() {
        this.currentVisibleElement = 0;
        return this.scrollToElement(false);
    }

    setupNewsFeedArray(res) {
        let c = 0;
        this.arr = [];
        const modifiedArr = res.articles.map(el => {
            if (!el.urlToImage) {
                el.urlToImage = this.noImageUrl;
            }

            if (Math.random() <= 0.5) {
                if (c === 2) {
                    el.colSize = 12;
                    c = 0;
                } else {
                    c++;
                    el.colSize = 6;
                }
            } else {
                c++;
                el.colSize = 6;
            }
            return el;
        });
        this.arr.push(...modifiedArr);
    }

    toggleView(viewType: string) {
        if (this.currentViewLayout === "xLargeCards") {
            console.log("eo me....!");
            this.currentVisibleElement = this.indexSlideService.getIndexToGoBack();
            this.canWatchScroll = false;
            console.log("k sm prsu nazaj sm dobu " + this.currentVisibleElement);
            document.getElementById('content').style.display = 'none';
        }
        this.currentViewLayout = viewType;
        console.log(this.currentViewLayout);
    }


    ngOnDestroy() {
        console.log('ngOnDestroy');
    }

}
