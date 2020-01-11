import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { LoadingController, AlertController, PopoverController, ToastController } from '@ionic/angular';
import { GoogleNewsApiService } from '../shared/google.news.api.service';
import { IndexSlideService } from '../shared/index.slide.service';
import { FontSizeService } from '../shared/font.service';
import { Subscription } from 'rxjs';
import { PerformanceService } from '../shared/performance.service';
import { Storage } from '@ionic/storage';
import { Plugins } from '@capacitor/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ThemeService } from '../shared/theme.service';
import { Platform } from '@ionic/angular';
import { PopoverComponent } from './popoverComponent/popover.component';
import { GagNewsApiService } from '../shared/gag.news.api.service';
import { SensorReadingService } from '../shared/sensor.reading.service';

interface ViewDescription {
    view: string;
    showimages: string;
    fontSize: string;
    theme: string;
}

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

    currentTheme = '';
    themeSub: Subscription;

    isAndroid = false;

    newsCategory = '';

    fontSizeDefaultB = true;

    contextSub: Subscription;

    currentViewSelectionData = null;
    fullViewDescription: ViewDescription = null;

    constructor(
        public loadingController: LoadingController,
        public googleNewsApi: GoogleNewsApiService,
        public indexSlideService: IndexSlideService,
        public fontService: FontSizeService,
        private changeDetector: ChangeDetectorRef,
        public performanceService: PerformanceService,
        public storage: Storage,
        public sanitizer: DomSanitizer,
        public alertController: AlertController,
        public theme: ThemeService,
        public platform: Platform,
        public popoverController: PopoverController,
        public gagsApiService: GagNewsApiService,
        public contextService: SensorReadingService,
        public toastController: ToastController) {

        const { MyImageDownloader } = Plugins;
        this.myImageDownloader = MyImageDownloader;
        this.isAndroid = this.platform.is('android');
    }

    ngOnInit() {

        this.selectRandomView();

        let lEl = null;
        this.googleNewsApi.canSendHttpRequestOrStorage('topHeadlines')
            .then(res => {
                if (typeof res === 'boolean') {
                    console.log('sending new http request ngOnInit');
                    console.log('=========================================');
                    this.displayLoadingElement()
                        .then(loadingEl => {
                            lEl = loadingEl;
                            loadingEl.present();
                            document.getElementById('content').style.display = 'none';
                            this.googleNewsApi.getTopHeadlines().subscribe(news => {
                                this.setupNewsFeedArray(news)
                                    .then(() => {
                                        this.googleNewsApi.storeNews('topHeadlines', this.arr, new Date());
                                        loadingEl.dismiss();
                                        document.getElementById('content').style.display = 'block';
                                    }).catch(err => {
                                        console.log('?=????===');
                                        console.log(err);
                                    });
                            }, err => {
                                console.log('Unable to fetch data');
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
                    console.log('iz storegea sm dobu nazaj ngOnInit');
                    console.log(res);
                    console.log('=========================================');
                    this.arr = [...res.n];
                    this.changeDetector.detectChanges();
                }
            }).catch(err => {
                console.log('canSendHttpRequestOrStorage err');
                console.log(err);
                lEl.dismiss()
                    .then(() => {
                        this.unableToFetchData();
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

        this.themeSub = this.theme.getTheme().subscribe((currentTheme) => {
            this.currentTheme = currentTheme;
        });


        this.contextSub = this.contextService.getCurrentContext().subscribe((contextData) => {

        });

        this.dataIntervalCollecting();
    }

    selectRandomView() {
        this.currentViewSelectionData = new Date();

        const images = (Math.random() < 0.5) ? true : false;
        this.showImages = images;

        let generatedView = '';
        const fontSize = (Math.random() < 0.5) ? 'large-font' : 'small-font';

        if (fontSize === 'large-font') {
            this.headlinesFontSize = 18;
            this.authorFontSize = 18;
        } else {
            this.headlinesFontSize = this.defaultFontSize;
            this.authorFontSize = this.defaultFontSize;
        }

        generatedView = this.getView(Math.round(Math.random() * 4), images);

        const theme = (Math.random() < 0.5) ? 'light-theme' : 'dark-theme';
        this.theme.setTheme(theme);

        this.toastController.create({
            message: `New view generated with parameters nview=${generatedView}\n \nfont=${fontSize}
                \nimages=${images}
                \ntheme=${this.currentTheme}`,
            duration: 5000
        }).then(toastEl => {
            toastEl.present();
        });

        this.changeDetector.detectChanges();
        this.toggleView(generatedView);
    }

    getView(n, images = true) {
        if (images) {
            switch (n) {
                case 0: return 'largeCards';
                case 1: return 'gridView';
                case 2: return 'miniCards';
                case 3: return 'xLargeCards';
            }
        } else {
            if (n < 2) {
                return 'largeCards';
            }
            return 'xLargeCards';
        }

        return 'largeCards';
    }

    dataIntervalCollecting() {
        setInterval(() => {
            console.log('generating new view');
            //this.selectRandomView();
        }, 10000);
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
        this.newsCategory = '';
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
                    this.searchQuery = '';
                } else {
                    httpRequestToPreform = this.googleNewsApi.getCustomNews(this.searchQuery);
                    keyForStorage = this.searchQuery;
                }

                this.googleNewsApi.canSendHttpRequestOrStorage(keyForStorage)
                    .then(res => {
                        if (typeof res === 'boolean') {
                            console.log('sending new http request search');
                            console.log('=================================');
                            httpRequestToPreform.subscribe(news => {
                                return this.setupNewsFeedArray(news)
                                    .then(() => {
                                        this.googleNewsApi.storeNews(keyForStorage, this.arr, new Date());
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
                            }, err => {
                                console.log('Unable to fetch data');
                                console.log(err);
                                loadingEl.dismiss()
                                    .then(() => {
                                        this.unableToFetchData();
                                    }).catch(errorClosingLoadingEl => {
                                        console.log(errorClosingLoadingEl);
                                    });
                            });
                        } else {
                            console.log('got from storage cache.');
                            console.log('=================================');
                            this.arr = [...res.n];
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

    configureImageCaching(res, is9gag = false) {
        const urlRequestsPromise = [];
        const imagesNeedToCache = [];

        if (!is9gag) {
            for (const el of res.articles) {
                if (el.urlToImage) {
                    if (this.isAndroid) {
                        urlRequestsPromise.push(this.myImageDownloader.getImage({ name: this.getImageNameByUrl(el.urlToImage) }));
                    }
                } else {
                    el.urlToImage = this.noImageUrl;
                    if (this.isAndroid) {
                        urlRequestsPromise.push(this.myImageDownloader.getImage({ name: this.noImageUrl }));
                    }
                }
            }
        } else {
            for (const el of res) {
                const imgUrl = this.extract9gagImage(el);
                if (el.urlToImage) {
                    urlRequestsPromise.push(this.myImageDownloader.getImage({ name: this.getImageNameByUrl(imgUrl) }));
                }
            }
        }

        return Promise.all(urlRequestsPromise).then((results) => {
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result && result.b64 !== 'noImage') {
                    console.log('got image from cache.');
                    const myStrB64 = 'data:image/jpg;base64,' + (this.sanitizer.bypassSecurityTrustResourceUrl(result.b64.replace(/(\r\n|\n|\r)/gm, "")) as any).changingThisBreaksApplicationSecurity;
                    if (!is9gag) {
                        res.articles[i].urlToImage = myStrB64;
                    } else {
                        res[i].urlToImage = myStrB64;
                    }
                } else if (result && result.b64 === 'noImage') {
                    if (!is9gag) {
                        imagesNeedToCache.push(res.articles[i].urlToImage);
                    } else {
                        imagesNeedToCache.push(res[i].urlToImage);
                    }
                }
            }
            return imagesNeedToCache;
        });

    }

    setupNewsFeedArray(res) {
        let c = 0;
        return this.configureImageCaching(res, false).then((imagesNeedToCache) => {
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
            if (this.isAndroid) {
                this.saveImagesToCache(imagesNeedToCache);
            }
            this.arr = [...modifiedArr];
            this.changeDetector.detectChanges();
        });

    }

    getImageNameByUrl(str) {
        const index = str.lastIndexOf('/') + 1;
        const imageName = str.substr(index);
        return imageName.replace(/[\W_]+/g, "");
    }

    saveImagesToCache(urls) {
        if (this.cache) {
            this.googleNewsApi.getInternetStatus()
                .then(b => {
                    if (b) {
                        const imgNames = [];
                        for (const url of urls) {
                            imgNames.push(this.getImageNameByUrl(url));
                        }
                        this.myImageDownloader.saveImage({ urls: urls, names: imgNames }).then(res => {
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
        if (this.currentViewLayout === viewType) {
            return;
        }
        if (this.currentViewLayout === 'xLargeCards') {
            this.currentVisibleElement = this.indexSlideService.getIndexToGoBack();
            this.canWatchScroll = false;
            document.getElementById('content').style.display = 'none';
        }
        this.currentViewLayout = viewType;
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

        if (this.newsCategory.startsWith('topHeadlines')) {
            const category = this.newsCategory.substring(12);
            if (category !== 'fun') {
                httpRequestToPreform = this.googleNewsApi.searchWithCategory(category);
            } else {
                httpRequestToPreform = this.gagsApiService.get9gagNews();
            }
            keyForStorage = this.newsCategory;
        }

        this.googleNewsApi.canSendHttpRequestOrStorage(keyForStorage)
            .then(res => {
                if (typeof res === 'boolean') {
                    console.log('sending new http request do_refresh');
                    console.log('=================================');
                    httpRequestToPreform.subscribe(news => {
                        // obj.news.feed.entry
                        if (keyForStorage !== 'topHeadlinesfun') {
                            this.setupNewsFeedArray(news)
                                .then(() => {
                                    this.googleNewsApi.storeNews(keyForStorage, this.arr, new Date());
                                    this.additionalTimeoutForViewSetup()
                                        .then(() => {
                                            return this.scrollToTop();
                                        })
                                        .then(() => {
                                            $event.target.complete();
                                        });
                                });
                        } else {
                            const objFor9gag = {
                                news: {
                                    rss: {
                                        channel: {
                                            item: news.rss.channel.item
                                        }
                                    }
                                }
                            };
                            this.setup9GagArray(objFor9gag).then(() => {
                                this.additionalTimeoutForViewSetup()
                                    .then(() => {
                                        return this.scrollToTop();
                                    })
                                    .then(() => {
                                        $event.target.complete();
                                    });
                            });
                        }

                    });
                } else {
                    console.log('got from storage do_refresh');
                    console.log('=================================');
                    this.arr = [...res.n];
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

    openNewsOptions(e) {
        this.popoverController.create({
            component: PopoverComponent,
            event: e
        }).then(popoverEl => {
            popoverEl.present();
            return popoverEl.onDidDismiss();
        }).then(d => {
            return d.data;
        }).then(obj => {
            if (obj && obj.news && obj.category) {
                this.newsCategory = 'topHeadlines' + obj.category;
                this.title = obj.category;
                this.searchQuery = '';
                if (!obj.cache) {
                    console.log('sent new http request popover.');
                    console.log('==============================');
                    if (obj.category !== 'fun') {
                        this.setupNewsFeedArray(obj.news).then(() => {
                            this.googleNewsApi.storeNews(this.newsCategory, this.arr, new Date());
                        });
                    } else {
                        this.setup9GagArray(obj);
                    }
                } else {
                    console.log('got from storage popover.');
                    console.log('==============================');
                    this.arr = [...obj.news.n];
                }
                this.scrollToTop();
            } else {
                if (obj && obj.error) {
                    this.unableToFetchData();
                }
            }
        });
    }

    extract9gagImage(el) {
        const domNode = document.createElement('div');
        domNode.innerHTML = el.description;
        return domNode.querySelector('img').src;
    }

    setup9GagArray(obj) {
        this.arr = [];
        let c = 0;

        console.log(obj);
        console.log('==========================================');
        return this.configureImageCaching(obj.news.rss.channel.item, true).then((imagesNeedToCache) => {
            for (const el of obj.news.rss.channel.item) {
                const urlToImage = this.extract9gagImage(el);
                console.log("title = " + el.title);
                const val = {
                    title: el.title.replace("&#039;", "'"),
                    author: '',
                    urlToImage,
                    url: el.guid.$t,
                    colSize: 6
                };

                if (Math.random() <= 0.5) {
                    if (c === 2) {
                        val.colSize = 12;
                        c = 0;
                    } else {
                        c++;
                        val.colSize = 6;
                    }
                } else {
                    c++;
                    val.colSize = 6;
                }

                this.arr.push(val);
            }
            if (this.isAndroid) {
                this.saveImagesToCache(imagesNeedToCache);
            }
            this.googleNewsApi.storeNews('topHeadlinesfun', this.arr, new Date());
            this.changeDetector.detectChanges();
        });

    }

    toggleTheme() {
        if (this.currentTheme === 'light-theme') {
            this.theme.setTheme('dark-theme');
        } else {
            this.theme.setTheme('light-theme');
        }
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

        if (this.themeSub) {
            this.themeSub.unsubscribe();
        }

        if (this.contextSub) {
            this.contextSub.unsubscribe();
        }
    }

    toggleFontSize() {
        if (this.fontSizeDefaultB) {
            this.headlinesFontSize = this.defaultFontSize;
            this.authorFontSize = this.defaultFontSize;
        } else {
            this.headlinesFontSize = 18;
            this.authorFontSize = 18;
        }
        this.fontSizeDefaultB = !this.fontSizeDefaultB;
    }

    toggleImagesShowing() {
        this.showImages = !this.showImages;
    }

}
