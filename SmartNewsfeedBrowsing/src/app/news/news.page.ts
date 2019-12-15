import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { GoogleNewsApiService } from '../shared/google.news.api.service';
import { IndexSlideService } from '../shared/index.slide.service';
import { FontSizeService } from '../shared/font.service';
import { Subscription } from 'rxjs';
import { PerformanceService } from '../shared/performance.service';
import { Storage } from '@ionic/storage';
import { Plugins } from '@capacitor/core';
import { DomSanitizer } from '@angular/platform-browser';

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
    noImageUrl = 'assets/noImg.jpg';
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
    myImageDownloader = null;


    constructor(public loadingController: LoadingController,
        public googleNewsApi: GoogleNewsApiService,
        public indexSlideService: IndexSlideService,
        public fontService: FontSizeService,
        private changeDetector: ChangeDetectorRef,
        public performanceService: PerformanceService,
        public storage: Storage,
        public sanitizer: DomSanitizer,
        public alertController: AlertController) {

        const { MyImageDownloader } = Plugins;
        this.myImageDownloader = MyImageDownloader;
    }

    ngOnInit() {
        console.log("ngOnInit");
        let lEl = null;
        this.googleNewsApi.canSendHttpRequestOrStorage('topHeadlines')
            .then(res => {
                console.log(res);
                if (typeof res === 'boolean') {
                    this.displayLoadingElement()
                        .then(loadingEl => {
                            lEl = loadingEl;
                            loadingEl.present();
                            document.getElementById('content').style.display = 'none';
                            this.googleNewsApi.getTopHeadlines().subscribe(news => {
                                console.log("od apija sem dobil");
                                console.log(news);
                                this.setupNewsFeedArray(news)
                                    .then(() => {
                                        console.log("storam notr");
                                        this.googleNewsApi.storeNews('topHeadlines', this.arr, new Date());
                                        loadingEl.dismiss();
                                        document.getElementById('content').style.display = 'block';
                                    }).catch(err => {
                                        console.log("?=????===");
                                        console.log(err);
                                    });
                            }, err => {
                                console.log("Unable to fetch data");
                                console.log(err);
                                loadingEl.dismiss()
                                    .then(() => {
                                        this.unableToFetchData();
                                    }).catch(errorClosingLoadingEl => {
                                        console.log(errorClosingLoadingEl);
                                    });
                            });
                        });
                } else {
                    console.log('iz storegea sm dobu nazaj');
                    console.log(res);
                    this.arr = [];
                    this.arr.push(...res.n);
                    this.changeDetector.detectChanges();
                }
            }).catch(err => {
                console.log('canSendHttpRequestOrStorage err');
                console.log(err);
                lEl.dismiss()
                    .then(() => {
                        this.unableToFetchData()
                    }).catch(errorClosingLoadingEl => {
                        console.log(errorClosingLoadingEl);
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


        this.storage.get('cache').then((val) => {
            if (typeof val !== 'boolean') {
                this.cache = true;
            } else {
                this.cache = val;
                this.performanceService.setCache(val);
            }
        });

        this.storage.get('showImage').then((val) => {
            if (typeof val !== 'boolean') {
                this.showImages = true;
            } else {
                this.showImages = val;
                this.performanceService.setCache(val);
            }
        });

        this.storage.get('authorSize').then((val) => {
            if (typeof val !== 'number') {
                this.authorFontSize = this.defaultFontSize;
            } else {
                this.authorFontSize = val;
                this.fontService.setHeadLineFontSize(val);
            }
            this.changeDetector.detectChanges();
        });

        this.storage.get('headlineSize').then((val) => {
            if (typeof val !== 'number') {
                this.headlinesFontSize = this.defaultFontSize;
            } else {
                this.headlinesFontSize = val;
                this.fontService.setHeadLineFontSize(val);
            }
            this.changeDetector.detectChanges();
        });

    }

    ionViewWillEnter() {

    }

    unableToFetchData() {
        this.alertController.create({
            header: 'Oh noo something went wrong..',
            message: 'No data to present ...',
            buttons: [{ text: 'OK', role: 'cancel' }]
        }).then(alertEl => {
            alertEl.present();
        });
    }

    displayLoadingElement() {
        return this.loadingController.create({
            message: 'Loading...'
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
        return this.showLoadingElementFor(500)
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
        let lEl = null;
        this.displayLoadingElement()
            .then(loadingEl => {
                lEl = loadingEl;
                loadingEl.present();
                document.getElementById('content').style.display = 'none';

                let httpRequestToPreform = null;
                let keyForStorage = '';
                if ($event === 'default') {
                    httpRequestToPreform = this.googleNewsApi.getTopHeadlines();
                    keyForStorage = 'topHeadlines';
                } else {
                    httpRequestToPreform = this.googleNewsApi.getCustomNews(this.searchQuery);
                    keyForStorage = this.searchQuery;
                }

                this.googleNewsApi.canSendHttpRequestOrStorage(keyForStorage)
                    .then(res => {
                        console.log("==================================================");
                        console.log("canSendHttpRequestOrStorage je vrnil");
                        console.log(res);
                        console.log("ki je tipa " + typeof res);
                        if (typeof res === 'boolean') {
                            httpRequestToPreform.subscribe(news => {
                                return this.setupNewsFeedArray(news)
                                    .then(() => {
                                        this.googleNewsApi.storeNews(keyForStorage, this.arr, new Date());
                                        console.log('storam v cache search.');
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
                        } else {
                            console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEELSEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");

                            console.log('search cached.');
                            this.arr = [];
                            this.arr.push(...res.n);
                            this.changeDetector.detectChanges();
                            loadingEl.dismiss();
                            document.getElementById('content').style.display = 'block';
                            this.title = this.searchQuery;
                            if ($event === 'default') {
                                this.title = 'Top Headlines';
                            }

                        }
                    }).catch(err => {
                        console.log(err);
                        lEl.dismiss()
                            .then(() => {
                                this.unableToFetchData();
                            }).catch(errorClosingLoadingEl => {
                                console.log(errorClosingLoadingEl);
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
        const urlRequestsPromise = [];
        const imageNeedToCache = [];
        for (let el of res.articles) {
            if (el.urlToImage) {
                console.log("push. " + el.urlToImage);
                console.log(this.getImageNameByUrl(el.urlToImage));
                urlRequestsPromise.push(this.myImageDownloader.getImage({ name: this.getImageNameByUrl(el.urlToImage) }));
            } else {
                el.urlToImage = this.noImageUrl;
            }

        }

        return Promise.all(urlRequestsPromise).then(results => {
            let i = 0;
            console.log("============================== results =======================");
            console.log(results);
            for (const result of results) {
                if (result && result.b64 !== 'noImage') {
                    console.log('got image from cache.');
                    let myStrB64 = 'data:image/jpg;base64,' + (this.sanitizer.bypassSecurityTrustResourceUrl(result.b64.replace(/(\r\n|\n|\r)/gm, "")) as any).changingThisBreaksApplicationSecurity;
                    res.articles[i].urlToImage = myStrB64;
                } else if (result && result.b64 === 'noImage') {
                    console.log('could not get image from cache.');
                    imageNeedToCache.push(res.articles[i].urlToImage);
                }
                i++;
            }
        }).then(() => {
            console.log("getu sm kar mam iz cachea zdej setupam array");
            const modifiedArr = res.articles.map(el => {
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

            this.saveImageToCache(imageNeedToCache);
            this.arr = [];
            this.arr.push(...modifiedArr);
            this.changeDetector.detectChanges();

        });


    }

    getImageNameByUrl(str) {
        const index = str.lastIndexOf("/") + 1;
        const imageName = str.substr(index);
        return imageName.replace(/[\W_]+/g, "");
    }

    saveImageToCache(urls) {
        console.log("cache boolean = " + this.cache);
        if (this.cache) {
            this.googleNewsApi.getInternetStatus()
                .then(b => {
                    console.log("b = " + b);
                    if (b) {
                        const imgNames = [];
                        for (const url of urls) {
                            imgNames.push(this.getImageNameByUrl(url));
                        }
                        console.log({ urls: urls, names: imgNames });
                        const mDownloader = this.myImageDownloader.saveImage({ urls: urls, names: imgNames }).then(res => {
                            console.log(res);
                        }).catch(err => {
                            console.log(err);
                        });
                    }
                });
        }

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
        let keyForStorage = '';
        if (this.searchQuery === '') {
            httpRequestToPreform = this.googleNewsApi.getTopHeadlines();
            keyForStorage = 'topHeadlines';
        } else {
            httpRequestToPreform = this.googleNewsApi.getCustomNews(this.searchQuery);
            keyForStorage = this.searchQuery;
        }

        this.googleNewsApi.canSendHttpRequestOrStorage(keyForStorage)
            .then(res => {
                if (typeof res === 'boolean') {
                    httpRequestToPreform.subscribe(news => {
                        this.setupNewsFeedArray(news)
                            .then(() => {
                                this.googleNewsApi.storeNews(keyForStorage, this.arr, new Date());
                                console.log('requested new data');
                                this.additionalTimeoutForViewSetup()
                                    .then(() => {
                                        return this.scrollToTop();
                                    }).then(() => {
                                        $event.target.complete();
                                    });
                            });
                    });
                } else {
                    this.arr = [];
                    this.arr.push(...res.n);
                    this.changeDetector.detectChanges();
                    this.scrollToTop()
                        .then(() => {
                            $event.target.complete();
                        });
                    $event.target.complete();

                }
            }).catch(err => {
                console.log(err);
                $event.target.complete()
                    .then(() => {
                        this.unableToFetchData();
                    }).catch(errClosingRefresher => {
                        console.log(errClosingRefresher);
                    });
            });
    }
    /*
    getImagesFromCache(arr) {
        const urlRequestsPromise = [];
        const imageNeedToCache = [];

        for (const el of arr) {
            if (el.urlToImage) {
                urlRequestsPromise.push(this.myImageDownloader.getImage({ name: this.getImageNameByUrl(el.urlToImage) }));
            } else {
                el.urlToImage = this.noImageUrl;
            }
        }

        return Promise.all(urlRequestsPromise)
            .then((results) => {
                console.log(results);
                for (const index in results) {
                    if (results[index]) {
                        if (results[index] && results[index].b64 !== 'noImage') {
                            console.log('got image from cache.');
                            let myStrB64 = 'data:image/jpg;base64,' + (this.sanitizer.bypassSecurityTrustResourceUrl(results[index].b64.replace(/(\r\n|\n|\r)/gm, "")) as any).changingThisBreaksApplicationSecurity;
                            arr[index].urlToImage = myStrB64;
                            console.log('sliko mam baby else part of refresh.');
                        } else {
                            imageNeedToCache.push(arr[index].urlToImage);
                            console.log('slike nimam else part of refresh.');
                        }
                    }
                }
                return { a: arr, imagesToBeCached: imageNeedToCache };
            });

    }*/

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
