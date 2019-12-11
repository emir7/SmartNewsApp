import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { GoogleNewsApiService } from '../shared/google.news.api.service';
import { IndexSlideService } from '../shared/index.slide.service';
import { FontSizeService } from '../shared/font.service';
import { Subscription, Subscriber } from 'rxjs';
import { PerformanceService } from '../shared/performance.service';

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

    authorFontSizeSub: Subscription;
    headlinesFontSizeSub: Subscription;

    defaultFontSize = 12 + (30 - 12) * ((window.innerWidth - 300) / (1600 - 300));
    authorFontSize = this.defaultFontSize;
    headlinesFontSize = this.defaultFontSize;

    showImages = true;
    cache = true;
    showImageSub: Subscription;
    cacheSub: Subscription;

    constructor(public loadingController: LoadingController,
        public googleNewsApi: GoogleNewsApiService,
        public indexSlideService: IndexSlideService,
        public fontService: FontSizeService,
        private changeDetector: ChangeDetectorRef,
        public performanceService: PerformanceService) { }

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

        this.authorFontSizeSub = this.fontService.getAuthorFontSize()
            .subscribe(currentFontSizeValue => {
                if (currentFontSizeValue !== 0) {
                    this.authorFontSize = currentFontSizeValue;
                    this.changeDetector.detectChanges();
                }
            });

        this.headlinesFontSizeSub = this.fontService.getHeadlineFontSize()
            .subscribe(currentFontSizeValue => {
                if (currentFontSizeValue !== 0) {
                    this.headlinesFontSize = currentFontSizeValue;
                    this.changeDetector.detectChanges();
                }
            });

        this.cacheSub = this.performanceService.getCache()
            .subscribe(currentCacheValue => {
                this.cache = currentCacheValue;
                this.changeDetector.detectChanges();
            });

        this.showImageSub = this.performanceService.getShowImage()
            .subscribe(currentShowImageValue => {
                this.showImages = currentShowImageValue;
                this.changeDetector.detectChanges();
            });

    }

    displayLoadingElement() {
        return this.loadingController.create({
            message: 'Loading...',
        });
    }

    onContentScroll() {
        if (this.canWatchScroll && this.currentViewLayout !== 'xLargeCards') {
            const elements = document.querySelectorAll('.activeList .card');
            for (let i = 0; i < elements.length; i++) {
                const rect = elements[i].getBoundingClientRect() as DOMRect;
                if (rect.y > 0) {
                    this.currentVisibleElement = i;
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
            this.normalScroll(false);
        } else if ($event === 'xLargeCardsLoaded') {
            this.fullScreenVerticalScroll();
        } else if ($event === 'gridViewLoaded') {
            this.gridViewScroll();
        }
    }

    normalScroll(isGridView) {
        this.canWatchScroll = false; // IMPORTANT
        this.showLoadingElementFor(500)
            .then(() => {
                return this.scrollToElement(isGridView);
            })
            .then(() => {
                setTimeout(() => {
                    this.canWatchScroll = true;
                }, 200);
            });
    }

    gridViewScroll() {
        this.canWatchScroll = false; // IMPORTANT
        this.showLoadingElementFor(500)
            .then(() => {
                return this.scrollToElement(true);
            })
            .then(() => {
                setTimeout(() => {
                    this.canWatchScroll = true;
                    document.getElementById('content').style.display = 'block';
                }, 200);
            });
    }

    fullScreenVerticalScroll() {
        this.canWatchScroll = false; // IMPORTANT
        const ionSlider = document.querySelector('.activeList .slides') as any;
        this.showLoadingElementFor(500)
            .then(() => {
                ionSlider.slideTo(this.currentVisibleElement, 100)
                    .then(() => {
                        return this.nekTimeout();
                    }).then(() => {
                        document.getElementById('content').style.display = 'block';
                        setTimeout(() => {
                            this.canWatchScroll = true;
                        }, 200);
                    });

            });
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
        this.displayLoadingElement()
            .then(loadingEl => {
                loadingEl.present();
                document.getElementById('content').style.display = 'none';

                let httpRequestToPreform = null;

                if ($event === 'default') {
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
        if (this.currentViewLayout === 'xLargeCards') {
            return this.fullScreenVerticalScroll();
        }
        return this.scrollToElement(false);
    }

    setupNewsFeedArray(res) {
        let c = 0;
        this.arr = [];
        const modifiedArr = res.articles.map(el => {
            if (!el.urlToImage) {
                el.urlToImage = this.noImageUrl;
            }

            el.title = this.parseFromHTMLIfPossible(el.title);
            el.author = this.parseFromHTMLIfPossible(el.author);

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

    parseFromHTMLIfPossible(str) {
        if (!str) {
            return '';
        }
        const a = document.createElement('div');
        a.innerHTML = str;
        return a.innerText;
    }

    toggleView(viewType: string) {
        if (this.currentViewLayout === 'xLargeCards') {
            this.currentVisibleElement = this.indexSlideService.getIndexToGoBack();
            this.canWatchScroll = false;
            document.getElementById('content').style.display = 'none';
        }
        this.currentViewLayout = viewType;
        console.log(this.currentViewLayout);
    }

    doRefresh($event) {
        let httpRequestToPreform = null;
        if (this.searchQuery === 'default') {
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
                    $event.target.complete();
                });
        });

    }

    ngOnDestroy() {
        if (this.authorFontSizeSub) {
            this.authorFontSizeSub.unsubscribe();
        }

        if (this.headlinesFontSizeSub) {
            this.headlinesFontSizeSub.unsubscribe();
        }

        if (this.showImageSub) {
            this.showImageSub.unsubscribe();
        }

        if (this.cacheSub) {
            this.cacheSub.unsubscribe();
        }
    }

}
