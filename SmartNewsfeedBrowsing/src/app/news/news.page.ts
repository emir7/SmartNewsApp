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
import { ContextModel, ViewDescription } from '../shared/models/context/contextModel';
import { ModalController } from '@ionic/angular';
import { QuickQuizModalPage } from './quickQuiz/quick.quiz.page';

@Component({
    selector: 'app-news',
    templateUrl: 'news.page.html',
    styleUrls: ['news.page.scss'],
})
export class NewsPage implements OnInit, OnDestroy {

    currentViewLayout = null;
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
    currentContextDescription: ContextModel = null;

    fullViewDescription: ViewDescription = null;

    dataCollectionIntervalID = null;

    batteryValidityObj = {
        percentage: -2,
        d: new Date()
    };

    brightnessValidityObj = {
        value: -2,
        d: new Date()
    };

    internetValidityObj = {
        value: -2,
        d: new Date()
    };

    userActivity = null;

    appInBackground = false;
    userInBrowser = false;

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
        public toastController: ToastController,
        public modalController: ModalController) {

        const { MyImageDownloader } = Plugins;
        this.myImageDownloader = MyImageDownloader;
        this.isAndroid = this.platform.is('android');
    }

    ngOnInit() {
        this.selectRandomView();
        this.handleResumeBackgroundEvents();

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
        /*
        this.showImageSub = this.performanceService.getShowImage()
            .subscribe(currentShowImageValue => {
                this.showImages = currentShowImageValue;
                this.changeDetector.detectChanges();
            });
        */

        this.storage.get('cache').then((val) => {
            if (typeof val !== 'boolean') {
                this.cache = true;
            } else {
                this.cache = val;
                this.performanceService.setCache(val);
            }
        });
        /*
        this.storage.get('showImage').then((val) => {
            if (typeof val !== 'boolean') {
                this.showImages = true;
            } else {
                this.showImages = val;
                this.performanceService.setCache(val);
            }
        });*/
        /*
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
        });*/

        this.themeSub = this.theme.getTheme().subscribe((currentTheme) => {
            this.currentTheme = currentTheme;
        });


        this.initContextSubscriber();

        if (this.contextService.getCurrentState() === 'INTERVAL_SAMPLING') {
            this.dataIntervalCollecting();
        }

        if (this.contextService.getCurrentState() === 'LAB_SAMPLING') {
            this.labDataCollecting();
        }

    }

    initContextSubscriber() {
        if (this.contextService.getCurrentState() === 'INTERVAL_SAMPLING') {
            this.contextSub = this.contextService.getCurrentContext().subscribe((contextData) => {
                this.currentContextDescription = contextData;
            });
        } else if (this.contextService.getCurrentState() === 'ON_CHANGE_SAMPLING') {
            this.contextSub = this.contextService.getCurrentContext().subscribe((contextData) => {
                if (this.appInBackground || this.userInBrowser) {
                    this.updatePreviousValues();
                    return;
                }

                if (this.isValidContextData(contextData)) {
                    this.currentContextDescription = contextData;
                    let writtenToFile = false;

                    if (!this.userActivity) {
                        this.userActivity = contextData.userActivityObj.types[0];
                    } else {
                        if (this.userActivity !== contextData.userActivityObj.types[0]) {
                            console.log('writing into file because user activity changed');
                            this.dataOnContextChange(this.userActivity, this.brightnessValidityObj.value, new Date().getHours(),
                                this.internetValidityObj.value, this.batteryValidityObj.percentage);
                            this.userActivity = contextData.userActivityObj.types[0];
                            writtenToFile = true;
                        }
                    }
                    if (this.internetValidityObj.value === -2) {
                        this.internetValidityObj.value = contextData.internetObj.value as number;
                        this.internetValidityObj.d = new Date();
                    } else {
                        console.log('1) Internet ' + ((new Date().getTime() - this.internetValidityObj.d.getTime()) / 1000));
                        console.log(`Internet ${this.internetValidityObj.value} and ${contextData.internetObj.value}`);
                        if (this.passed30sek(this.internetValidityObj.d)
                            && this.internetValidityObj.value !== contextData.internetObj.value) {
                            if (!writtenToFile) {
                                this.dataOnContextChange(this.userActivity, this.brightnessValidityObj.value, new Date().getHours(),
                                    this.internetValidityObj.value, this.batteryValidityObj.percentage);
                                writtenToFile = true;
                                console.log('writing into file because internet changed');
                            }
                        }
                    }
                    if (this.batteryValidityObj.percentage === -2) {
                        this.batteryValidityObj.percentage = contextData.batteryObj.percentage;
                        this.batteryValidityObj.d = new Date();
                    } else {
                        console.log('2) Battery' + ((new Date().getTime() - this.batteryValidityObj.d.getTime()) / 1000));
                        console.log(`Battery ${this.batteryValidityObj.percentage} and ${contextData.batteryObj.percentage}`);
                        if (this.passed30sek(this.batteryValidityObj.d)
                            && this.batteryValidityObj.percentage !== contextData.batteryObj.percentage) {
                            if (!writtenToFile) {
                                this.dataOnContextChange(this.userActivity, this.brightnessValidityObj.value, new Date().getHours(),
                                    this.internetValidityObj.value, this.batteryValidityObj.percentage);
                                writtenToFile = true;
                                console.log('writing into file because battery level changed');
                            }
                        }
                    }
                    if (this.brightnessValidityObj.value === -2) {
                        this.brightnessValidityObj.value = contextData.brightnessObj.value;
                        this.brightnessValidityObj.d = new Date();
                    } else {
                        console.log('3) Brightness' + ((new Date().getTime() - this.brightnessValidityObj.d.getTime()) / 1000));
                        console.log(`Battery ${this.brightnessValidityObj.value} and ${contextData.brightnessObj.value}`);

                        if (this.passed30sek(this.brightnessValidityObj.d)
                            && this.brightnessValidityObj.value !== contextData.brightnessObj.value) {
                            if (!writtenToFile) {
                                this.dataOnContextChange(this.userActivity, this.brightnessValidityObj.value, new Date().getHours(),
                                    this.internetValidityObj.value, this.batteryValidityObj.percentage);
                                writtenToFile = true;
                                console.log('writing into file because Brightness changed');
                            }
                        }
                    }
                }

            });
        } else if (this.contextService.getCurrentState() === 'LAB_SAMPLING') {
            this.contextSub = this.contextService.getCurrentContext().subscribe((contextData) => {
                this.currentContextDescription = contextData;
            });
        }
    }

    updatePreviousValues() {
        this.userActivity = this.currentContextDescription.userActivityObj.types[0];

        this.batteryValidityObj.percentage = this.currentContextDescription.batteryObj.percentage;
        this.batteryValidityObj.d = new Date();

        this.internetValidityObj.value = this.currentContextDescription.internetObj.value as number;
        this.internetValidityObj.d = new Date();

        this.brightnessValidityObj.value = this.currentContextDescription.brightnessObj.value;
        this.brightnessValidityObj.d = new Date();

        this.fullViewDescription.d = new Date();
    }

    passed30sek(d: Date) {
        return (new Date().getTime() - d.getTime()) / 1000 >= 30;
    }

    isValidContextData(contextData: ContextModel) {
        for (const el of contextData.validObjs) {
            if (!el) {
                return false;
            }
        }
        return true;
    }

    handleResumeBackgroundEvents() {
        this.platform.pause.subscribe(() => {
            console.log('pause');
            clearInterval(this.dataCollectionIntervalID);
            this.appInBackground = true;
            if (!this.userInBrowser) {
                this.dataOnChangeCollection();
            }
        });

        this.platform.resume.subscribe(() => {
            this.appInBackground = false;
            this.fullViewDescription.d = new Date();
            this.resetDataCollection();
            this.resetDataLabCollection();
        });
    }

    selectRandomView() {
        this.showImages = (Math.random() < 0.5) ? true : false;

        let generatedView = '';
        let fontSize = (Math.random() < 0.5) ? 'large-font' : 'small-font';

        if (fontSize === 'large-font') {
            this.headlinesFontSize = 18;
            this.authorFontSize = 18;
            this.fontSizeDefaultB = false;
        } else {
            this.headlinesFontSize = this.defaultFontSize;
            this.authorFontSize = this.defaultFontSize;
            this.fontSizeDefaultB = true;
        }

        generatedView = this.getView(Math.floor(Math.random() * 4), this.showImages);

        if (generatedView === 'gridView') {
            fontSize = 'small-font';
            this.fontSizeDefaultB = true;
        }

        const theme = (Math.random() < 0.5) ? 'light-theme' : 'dark-theme';
        this.theme.setTheme(theme);
        this.fullViewDescription = {
            fontSize,
            showimages: (this.showImages) ? 'withImages' : 'noImages',
            theme,
            view: generatedView,
            c: 0,
            d: new Date()
        };

        this.currentTheme = theme;

        this.currentViewLayout = generatedView;
        this.changeDetector.detectChanges();
        this.toggleView(generatedView);
    }

    sameView(v: ViewDescription) {
        return v.fontSize === this.fullViewDescription.fontSize && v.showimages === this.fullViewDescription.showimages
            && v.theme === this.fullViewDescription.theme && v.view === this.fullViewDescription.view;
    }

    getView(n, images) {
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

    labDataCollecting() {
        this.dataCollectionIntervalID = setInterval(() => {
            this.modalController.dismiss().finally(() => {
                clearInterval(this.dataCollectionIntervalID);
                this.dataCollectionIntervalID = null;
                this.openQuiz().then((data) => {
                    if (data == null) {
                        this.selectRandomView();
                        this.labDataCollecting();
                        return;
                    }
                    this.contextService.sendCurrentContextToServer(this.currentContextDescription, data, this.fullViewDescription);
                });
            });
        }, 10000);
    }

    dataIntervalCollecting() {
        this.dataCollectionIntervalID = setInterval(() => {
            const cView: ViewDescription = {
                c: 0,
                d: new Date(),
                fontSize: (this.fontSizeDefaultB) ? 'small-font' : 'large-font',
                showimages: (this.showImages) ? 'withImages' : 'noImages',
                theme: this.currentTheme,
                view: this.currentViewLayout
            };
            if (this.sameView(cView)) {
                console.log('writing data into file');
                this.contextService.writeToFile(this.fullViewDescription, this.currentContextDescription);
                this.fullViewDescription.c += 1;
            }
            if (this.fullViewDescription.c >= 1) { // po 120sek zamenjamo view.
                //this.selectRandomView();
            }
        }, 10000);
    }

    dataOnContextChange(uA, brightness, tod, internet, batLevel) {
        this.contextService.writeToFileOnlyOnContextChange(uA, brightness, tod, internet, batLevel, this.fullViewDescription);
        this.updatePreviousValues();
    }

    dataOnChangeCollection() {
        if (this.contextService.getCurrentState() === 'ON_CHANGE_SAMPLING') {

            const tmpUa = this.userActivity;
            const tmpBright = this.brightnessValidityObj.value;
            const tmpNet = this.internetValidityObj.value;
            const tmpBat = this.batteryValidityObj.percentage;
            this.contextService.writeToFileOnlyOnContextChange(tmpUa, tmpBright, new Date().getHours(), tmpNet, tmpBat, this.fullViewDescription);

            this.updatePreviousValues();
        }
    }

    inBrowser($event) {
        if ($event === 'inBrowser') {
            clearInterval(this.dataCollectionIntervalID);
            this.dataCollectionIntervalID = null;
            this.contextService.writeToFile(this.fullViewDescription, this.currentContextDescription);
            this.userInBrowser = true;
        } else {
            this.userInBrowser = false;
            this.resetDataCollection();
        }
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

    toggleView(viewType: string, htmlEL = false) {
        if (this.currentViewLayout === viewType) {
            document.querySelector(`.${this.currentViewLayout}-icon`).setAttribute('color', 'primary')
            return;
        }

        this.dataOnChangeCollection();
        this.fullViewDescription.view = viewType;
        this.resetDataCollection();

        if (this.currentViewLayout === 'xLargeCards') {
            this.currentVisibleElement = this.indexSlideService.getIndexToGoBack();
            this.canWatchScroll = false;
            document.getElementById('content').style.display = 'none';
        }
        console.log('removam atribut iz ' + this.currentViewLayout);
        console.log('dajem atribut na ' + viewType);
        document.querySelector(`.${this.currentViewLayout}-icon`).removeAttribute('color');
        document.querySelector(`.${viewType}-icon`).setAttribute('color', 'primary');

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

        return this.configureImageCaching(obj.news.rss.channel.item, true).then((imagesNeedToCache) => {
            for (const el of obj.news.rss.channel.item) {
                const urlToImage = this.extract9gagImage(el);
                const val = {
                    title: el.title.replace(/&#039;/g, "'"),
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
        this.dataOnChangeCollection();
        this.clearAndSend(); // DEBUG
        if (this.currentTheme === 'light-theme') {
            this.theme.setTheme('dark-theme');
            this.fullViewDescription.theme = 'dark-theme';
        } else {
            this.theme.setTheme('light-theme');
            this.fullViewDescription.theme = 'light-theme';
        }
        this.resetDataCollection();
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
        if (this.currentViewLayout === 'gridView') {
            return;
        }

        this.clearAndSend(); // DEBUG!
        this.dataOnChangeCollection();
        this.fontSizeDefaultB = !this.fontSizeDefaultB;
        if (this.fontSizeDefaultB) {
            this.headlinesFontSize = this.defaultFontSize;
            this.authorFontSize = this.defaultFontSize;
            this.fullViewDescription.fontSize = 'small-font';
        } else {
            this.headlinesFontSize = 18;
            this.authorFontSize = 18;
            this.fullViewDescription.fontSize = 'large-font';
        }
        this.resetDataCollection();
    }

    clearAndSend() {
        if (this.contextService.getCurrentState() === 'LAB_SAMPLING') {
            clearInterval(this.dataCollectionIntervalID);
            this.dataCollectionIntervalID = null;
            this.contextService.sendCurrentContextToServer(this.currentContextDescription, -6, this.fullViewDescription);
            this.labDataCollecting();
        }
    }

    toggleImagesShowing() {
        this.showImages = !this.showImages;

        if (this.contextService.getCurrentState() === 'INTERVAL_SAMPLING') {
            this.fullViewDescription.showimages = (this.showImages) ? 'withImages' : 'noImages';
        } else if (this.contextService.getCurrentState() === 'ON_CHANGE_SAMPLING') {
            this.fullViewDescription.showimages = (!this.showImages) ? 'withImages' : 'noImages';
        } else if (this.contextService.getCurrentState() === 'LAB_SAMPLING') {
            this.fullViewDescription.showimages = (!this.showImages) ? 'withImages' : 'noImages';
            this.clearAndSend(); // DEBUG!
        }

        if (this.currentViewLayout === 'gridView') {
            this.toggleView('largeCards');
        } else {
            this.resetDataCollection();
            this.dataOnChangeCollection();
        }

        this.fullViewDescription.showimages = (this.showImages) ? 'withImages' : 'noImages';
    }

    resetDataCollection() {
        if (this.contextService.getCurrentState() === 'INTERVAL_SAMPLING') {
            this.fullViewDescription.d = new Date();
            this.fullViewDescription.c = 0;
            clearInterval(this.dataCollectionIntervalID);
            this.dataIntervalCollecting();
        }
    }

    resetDataLabCollection() {
        if (this.contextService.getCurrentState() === 'LAB_SAMPLING') {
            clearInterval(this.dataCollectionIntervalID);
            this.dataCollectionIntervalID = null;
        }
    }

    openQuiz() {
        return this.modalController.create({
            component: QuickQuizModalPage,
            cssClass: 'quiz',
            backdropDismiss: false
        }).then(modalEl => {
            modalEl.present();
            return modalEl.onDidDismiss();
        }).then((obj) => {
            if (obj.data) {
                return obj.data;
            }
            return null;
        });
    }
}
