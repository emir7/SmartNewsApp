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
import { MlService } from '../shared/ml.service';
import { take, takeUntil } from 'rxjs/operators';
import { LabAPIService } from '../shared/lab.testing.api.service';

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

    quizIsOpened = false;

    indexSub: Subscription = null;
    upperMenuButtonsColor = '';
    userInfo = null;


    machineLearningPlugin = null;
    mlContextSub: Subscription;

    mlQuizTimeout = null;
    needUserFeedback = false;

    topPredictedView = null;

    banditData = null;
    banditPullIndex = 0;

    lastPredictionDate: Date;

    firstTimeInNews = false;

    cancelLearning = false;
    modelDecisionBoundry = -1;

    modelSelected = 0;

    samplingType = '';

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
        public modalController: ModalController,
        public mlService: MlService,
        public labApiService: LabAPIService) {

        const { MyImageDownloader } = Plugins;
        this.myImageDownloader = MyImageDownloader;
        this.isAndroid = this.platform.is('android');
        const { MachineLearning } = Plugins;

        this.machineLearningPlugin = MachineLearning;

    }

    ngOnInit() {

        this.storage.get('userInfo').then((userDatRet) => {
            this.userInfo = userDatRet;
        });

        setTimeout(() => {
            this.contextService.getCurrentContext().pipe(take(1)).subscribe((ctx) => {
                if (!ctx.validObjs[0] || !ctx.validObjs[1] || !ctx.validObjs[2]) {
                    //this.mlDebug('SETAM VEREDNOSTI, KER NISM DOBU NČ OD GOOGLE ACTIVITY RECOG');
                    this.contextService.setValidObjs([true, true, true]);
                }
            });
        }, 10000);


        this.phaseController().then((samplingType) => {
            console.log('samplingType is ' + samplingType);
            this.samplingType = samplingType;
            if (samplingType === 'SMART_SAMPLING') {
                this.subscribeToMLContext();
            } else {
                this.initLabSampling();
            }
        });



        //this.selectRandomView();
        this.handleResumeBackgroundEvents();
        //this.labDataCollecting();

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

        this.themeSub = this.theme.getTheme().subscribe((currentTheme) => {
            this.currentTheme = currentTheme;
        });


        this.initContextSubscriber();

        if (this.contextService.getCurrentState() === 'INTERVAL_SAMPLING') {
            this.dataIntervalCollecting();
        }

        if (this.contextService.getCurrentState() === 'SMART_SAMPLING') {
            //  this.openQuiz();
        }

        this.indexSlideService.getIndexToGoBack().subscribe((currentSlidingIndex) => {
            this.currentVisibleElement = currentSlidingIndex;
        });

    }

    phaseController() {

        return this.storage.get('dateOfInstall').then((t) => {
            const timeDiff = (new Date().getTime() - new Date(t).getTime()) / (1000 * 60 * 60 * 24);
            console.log('DNEVI od installacije ===== ' + timeDiff);
            if (Math.floor(timeDiff) < 14) {
                return null;
            } else {
                return Promise.all([this.storage.get('selectedModel'), this.storage.get('selectedModelDate')]);
            }
        }).then((objResult) => {
            if (objResult == null) {
                return 'SMART_SAMPLING';
            } else {
                const lastSelectedModel = objResult[0];
                const modelT = objResult[1];

                if (lastSelectedModel == null || lastSelectedModel === -1) {
                    this.modelSelected = 0;
                    this.storage.set('selectedModel', 0);
                    this.storage.set('selectedModelDate', new Date().getTime());
                } else {
                    const timeDiffM = (new Date().getTime() - new Date(modelT).getTime()) / (1000 * 60 * 60);
                    console.log('DNEVI od modelaaaaaaa ===== ' + timeDiffM);
                    console.log('ZADNI ČAS MODEL JE ' + modelT);
                    console.log('ZADNI UPORABLJENI MODEL JE ' + lastSelectedModel);
                    if (Math.floor(timeDiffM) >= 24) {
                        if (lastSelectedModel === 0) {
                            this.modelSelected = 1;
                        } else if (lastSelectedModel === 1) {
                            this.modelSelected = 0;
                        }

                        this.storage.set('selectedModel', this.modelSelected);
                        this.storage.set('selectedModelDate', new Date().getTime());

                    }

                }

                return 'LAB_SAMPLING';

            }
        });


    }

    fetchInitNews() {
        let lEl = null;
        this.googleNewsApi.canSendHttpRequestOrStorage('topHeadlines')
            .then(res => {
                if (typeof res === 'boolean') {
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
                    this.arr = [...res.n];
                    this.changeDetector.detectChanges();
                }
            }).catch(err => {
                lEl.dismiss()
                    .then(() => {
                        this.unableToFetchData();
                    }).catch(errorClosingLoadingEl => {
                        console.log(errorClosingLoadingEl);
                    });

            });
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
                        if (this.passed30sek(this.internetValidityObj.d)
                            && this.internetValidityObj.value !== contextData.internetObj.value) {
                            if (!writtenToFile) {
                                this.dataOnContextChange(this.userActivity, this.brightnessValidityObj.value, new Date().getHours(),
                                    this.internetValidityObj.value, this.batteryValidityObj.percentage);
                                writtenToFile = true;
                            }
                        }
                    }
                    if (this.batteryValidityObj.percentage === -2) {
                        this.batteryValidityObj.percentage = contextData.batteryObj.percentage;
                        this.batteryValidityObj.d = new Date();
                    } else {
                        if (this.passed30sek(this.batteryValidityObj.d)
                            && this.batteryValidityObj.percentage !== contextData.batteryObj.percentage) {
                            if (!writtenToFile) {
                                this.dataOnContextChange(this.userActivity, this.brightnessValidityObj.value, new Date().getHours(),
                                    this.internetValidityObj.value, this.batteryValidityObj.percentage);
                                writtenToFile = true;
                            }
                        }
                    }
                    if (this.brightnessValidityObj.value === -2) {
                        this.brightnessValidityObj.value = contextData.brightnessObj.value;
                        this.brightnessValidityObj.d = new Date();
                    } else {

                        if (this.passed30sek(this.brightnessValidityObj.d)
                            && this.brightnessValidityObj.value !== contextData.brightnessObj.value) {
                            if (!writtenToFile) {
                                this.dataOnContextChange(this.userActivity, this.brightnessValidityObj.value, new Date().getHours(),
                                    this.internetValidityObj.value, this.batteryValidityObj.percentage);
                                writtenToFile = true;
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

    subscribeToMLContext() {
        console.log('initing smart sampling');

        this.displayLoadingElement().then(loadingEl => {
            loadingEl.present();
            console.log("IZVAJAM SE1");

            if (this.mlContextSub) {
                this.mlContextSub.unsubscribe();
            }

            let tmpBool = false;

            this.mlContextSub = this.contextService.getCurrentContext().subscribe((ctxData) => {
                console.log("IZVAJAM SE2");
                let globalObj = null;
                console.log(ctxData);

                console.log("MYBOOL: " + tmpBool);
                if (this.mlContextSub) {
                    console.log("MLCONTEXT IS CLOSED = " + this.mlContextSub.closed);
                }

                if (ctxData != null && ctxData.validObjs[0] && ctxData.validObjs[1] && ctxData.validObjs[2] && !tmpBool && this.mlContextSub && !this.cancelLearning) {
                    this.mlContextSub.unsubscribe();

                    tmpBool = true;
                    console.log(ctxData);
                    this.lastPredictionDate = new Date();
                    this.dismissAllQuizs();
                    console.log("IZVAJAM SE3");
                    this.machineLearningPlugin.classifierPrediction({
                        u: ctxData.userActivityObj.types[0],
                        e: '' + ctxData.brightnessObj.value,
                        algorithm: 0
                    }).then((clfPredData) => {

                        let maxConfidence = 0;
                        let choosenIndex = 0;
                        for (let i = 0; i < clfPredData.a.length; i++) {
                            if (clfPredData.a[i].p >= maxConfidence) {
                                maxConfidence = clfPredData.a[i].p;
                                choosenIndex = i;
                            }
                        }
                        this.topPredictedView = clfPredData.a[choosenIndex];
                        this.modelDecisionBoundry = clfPredData.b;
                        return {
                            a: clfPredData.a,
                            i: choosenIndex,
                            b: clfPredData.b
                        };
                    }).then((obj) => {
                        globalObj = obj;
                        console.log("prediction");
                        console.log(obj);
                        return obj;
                    }).then((_) => {
                        loadingEl.dismiss();
                        return this.mlService.upperConfidenceBound();
                    }).then((data) => {
                        console.log("-------------------------");
                        console.log(data);
                        console.log("-------------------------");
                        const allSelections = data.selections;
                        console.log("haduken");
                        console.log(allSelections);
                        console.log("haduken");

                        const lastValue = allSelections[allSelections.length - 1];
                        this.banditPullIndex = lastValue;
                        this.banditData = data;

                        switch (lastValue) {
                            case 0:
                                this.openQuiz(this.mlService.marginalSoftmax(globalObj.a, globalObj.i, globalObj.b));
                                break;
                            case 1:
                                this.openQuiz(this.mlService.randomSelection());
                                break;
                            case 2:
                                this.openQuiz(this.mlService.randomByUserActivity(ctxData.userActivityObj.types[0]));
                                break;
                            case 3:
                                this.openQuiz(this.mlService.leastConfidence(globalObj.a[globalObj.i], globalObj.b));
                                break;
                        }

                        if (!this.firstTimeInNews) {
                            this.fetchInitNews();
                            this.firstTimeInNews = true;
                        }

                        this.setDisplayView(this.topPredictedView);

                    }).catch(err => {
                        this.cancelLearning = true;
                        loadingEl.dismiss();
                        if (!this.firstTimeInNews) {
                            this.fetchInitNews();
                            this.firstTimeInNews = true;
                        }

                        this.selectRandomView();

                        console.log(err);
                        console.log('Error while predicting and calculating bandit');
                    });

                }
            });


        });
    }

    initLabSampling() {
        console.log('initing lab sampling');
        this.displayLoadingElement()
            .then(loadingEl => {
                loadingEl.present();

                let tmpBool = false;
                this.mlContextSub = this.contextService.getCurrentContext().subscribe((ctxData) => {

                    if (ctxData != null && ctxData.validObjs[0] && ctxData.validObjs[1] && ctxData.validObjs[2] && !tmpBool && this.mlContextSub && !this.cancelLearning) {
                        tmpBool = true;
                        this.lastPredictionDate = new Date();
                        this.mlContextSub.unsubscribe();

                        this.machineLearningPlugin.classifierPrediction({
                            u: ctxData.userActivityObj.types[0],
                            e: '' + ctxData.brightnessObj.value,
                            algorithm: this.modelSelected
                        }).then((clfPredData) => {
                            let maxConfidence = 0;
                            let choosenIndex = 0;
                            for (let i = 0; i < clfPredData.a.length; i++) {
                                if (clfPredData.a[i].p >= maxConfidence) {
                                    maxConfidence = clfPredData.a[i].p;
                                    choosenIndex = i;
                                }
                            }

                            if (!this.firstTimeInNews) {
                                this.fetchInitNews();
                                this.firstTimeInNews = true;
                            }

                            this.topPredictedView = clfPredData.a[choosenIndex];
                            this.setDisplayView(this.topPredictedView);

                            this.modelDecisionBoundry = clfPredData.b;
                            loadingEl.dismiss();
                            this.setLabTestingTimer();
                        }).catch(err => {
                            if (!this.firstTimeInNews) {
                                this.fetchInitNews();
                                this.firstTimeInNews = true;
                            }

                            loadingEl.dismiss();
                            this.selectRandomView();
                            this.setDisplayView(this.topPredictedView);

                            console.log(err);
                        });
                    }

                });

            });
    }

    setLabTestingTimer() {
        this.mlQuizTimeout = setTimeout(() => {
            this.sendMetricsToServer('?');
        }, 20000);
    }

    sendMetricsToServer(o) {

        this.contextService.getCurrentContext().pipe(take(1)).subscribe((ctx) => {
            if (ctx != null && ctx.validObjs[0] && ctx.validObjs[1] && ctx.validObjs[2]) {

                const phaseTwo = {
                    algorithm: this.modelSelected,
                    userActivity: ctx.userActivityObj.types[0],
                    environmentBrightness: ctx.brightnessObj.value,
                    theme: this.topPredictedView.t,
                    layout: this.topPredictedView.l,
                    fontSize: this.topPredictedView.f,
                    predictionProbability: this.topPredictedView.p,
                    output: o
                }

                const username = this.userInfo.username + this.userInfo.id;
                this.labApiService.postData(username, phaseTwo);

                clearTimeout(this.mlQuizTimeout);
                this.mlQuizTimeout = null;
            }
        });


    }

    labTestingQuizAlert() {
        this.dismissAllQuizs();

        console.log('clearam timeeeeeeeout.....');

        clearTimeout(this.mlQuizTimeout);
        this.mlQuizTimeout = null;

        this.alertController.create({
            header: 'Ali ste bili zadovoljni s predhodnim prikazom novic?',
            backdropDismiss: false,
            buttons: [{
                text: 'DA',
                handler: () => {
                    this.sendMetricsToServer('Y');
                }
            }, {
                text: 'NE',
                handler: () => {
                    this.sendMetricsToServer('N');
                }
            }]
        }).then((alertEl) => {
            alertEl.present();
        });
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
            this.dismissAllQuizs();


            if (this.mlContextSub) {
                console.log('brisem subscription');
                this.mlContextSub.unsubscribe();
            }
            console.log("----------PAUSING APP!----------");
            console.log('brisem timeoute');

            clearTimeout(this.mlQuizTimeout);
            this.mlQuizTimeout = null;
            this.lastPredictionDate = null;
        });

        this.platform.resume.subscribe(() => {
            console.log("----------RESUMING APP!----------");

            this.dismissAllQuizs();

            if (!this.mlContextSub || this.mlContextSub.closed) {
                console.log('vracam subscription');
                // RESUB
                if (this.samplingType === 'SMART_SAMPLING') {
                    this.subscribeToMLContext();
                } else if (this.samplingType === 'LAB_SAMPLING') {
                    this.initLabSampling();
                }
            }

        });
    }

    selectRandomView() {
        this.showImages = true;

        let generatedView = '';
        const fontSize = (Math.random() < 0.5) ? 'large-font' : 'small-font';

        if (fontSize === 'large-font') {
            this.headlinesFontSize = 18;
            this.authorFontSize = 18;
            this.fontSizeDefaultB = false;
        } else {
            this.headlinesFontSize = this.defaultFontSize;
            this.authorFontSize = this.defaultFontSize;
            this.fontSizeDefaultB = true;
        }

        generatedView = (Math.random() < 0.5) ? 'largeCards' : 'xLargeCards';

        const theme = (Math.random() < 0.5) ? 'light-theme' : 'dark-theme';
        this.theme.setTheme(theme);
        this.fullViewDescription = {
            fontSize,
            showimages: 'withImages',
            theme,
            view: generatedView,
            c: 0,
            d: new Date()
        };

        this.currentTheme = theme;
        if (this.currentViewLayout != null) {
            this.removeColorAtribite(`.${this.currentViewLayout}-icon`);
        } else {
            this.setColorAtribute(`.${generatedView}-icon`);
        }
        this.currentViewLayout = generatedView;
        this.changeDetector.detectChanges();

        this.topPredictedView = {
            t: this.fullViewDescription.theme,
            f: this.fullViewDescription.fontSize,
            l: this.fullViewDescription.view,
            p: -1
        };

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

    setDisplayView(data) {

        return new Promise((resolve, reject) => {
            this.showImages = true;

            const generatedView = data.l;
            const fontSize = data.f;

            if (fontSize === 'large-font') {
                this.headlinesFontSize = 18;
                this.authorFontSize = 18;
                this.fontSizeDefaultB = false;
            } else {
                this.headlinesFontSize = this.defaultFontSize;
                this.authorFontSize = this.defaultFontSize;
                this.fontSizeDefaultB = true;
            }


            const theme = data.t;
            this.theme.setTheme(theme);
            this.fullViewDescription = {
                fontSize,
                showimages: 'withImages',
                theme,
                view: generatedView,
                c: 0,
                d: new Date()
            };

            this.currentTheme = theme;
            if (this.currentViewLayout != null) {
                this.removeColorAtribite(`.${this.currentViewLayout}-icon`);
            } else {
                this.setColorAtribute(`.${generatedView}-icon`);
            }
            this.currentViewLayout = generatedView;

            this.changeDetector.detectChanges();
            this.toggleView(generatedView);
            resolve();
        });

    }

    labDataCollecting() {
        if (this.dataCollectionIntervalID) {
            console.log('================================ INTERVAL ALREADY STARTED ================================');
            return;
        }

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
        console.log("BROWSER EVENT: " + $event);
        /* if ($event === 'inBrowser') {
             this.dismissAllQuizs();
 
 
             if (this.mlContextSub) {
                 console.log('sou sm v browser, zato brisem subscription');
                 this.mlContextSub.unsubscribe();
             }
             console.log('sou sm v browser, zato brisem timeoute in use');
             this.lastPredictionDate = null;
             clearTimeout(this.mlQuizTimeout);
             this.mlQuizTimeout = null;
         } else {
             console.log('sou sm iz browserja nazaj v app');
 
             if (!this.mlContextSub || this.mlContextSub.closed) {
                 console.log('sou sm iz browserja nazaj v app in vracam subscription!');
                 // RESUB
                 if (this.samplingType === 'SMART_SAMPLING') {
                     this.subscribeToMLContext();
                 } else if (this.samplingType === 'LAB_SAMPLING') {
                     this.initLabSampling();
                 }
 
             }
         }*/


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
            message: 'Nalaganje...'
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
            message: 'Nalaganje...',
            duration: ms
        }).then(loadingEl => {
            loadingEl.present();
            return loadingEl.onDidDismiss();
        });
    }

    setColorAtribute(key) {
        if (document.querySelector(key) != null) {
            document.querySelector(key).setAttribute('color', 'primary');
        }
    }

    removeColorAtribite(key) {
        if (document.querySelector(key) != null) {
            document.querySelector(key).removeAttribute('color');
        }
    }

    viewIsLoaded($event) {
        if ($event === 'miniCardsLoaded' || $event === 'largeCardsLoaded') {
            if ($event === 'miniCardsLoaded') {
                this.setColorAtribute('.miniCards-icon');
            } else {
                this.setColorAtribute('.largeCards-icon');
            }
            this.normalScroll(false);
        } else if ($event === 'xLargeCardsLoaded') {
            this.setColorAtribute('.xLargeCards-icon');
            this.fullScreenVerticalScroll();
        } else if ($event === 'gridViewLoaded') {
            this.setColorAtribute('.gridView-icon');
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
                                console.log(err);
                                loadingEl.dismiss()
                                    .then(() => {
                                        this.unableToFetchData();
                                    }).catch(errorClosingLoadingEl => {
                                        console.log(errorClosingLoadingEl);
                                    });
                            });
                        } else {
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
                if (imgUrl == null) {
                    continue;
                }
                if (el.urlToImage) {
                    urlRequestsPromise.push(this.myImageDownloader.getImage({ name: this.getImageNameByUrl(imgUrl) }));
                }
            }
        }

        return Promise.all(urlRequestsPromise).then((results) => {
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result && result.b64 !== 'noImage') {
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
            this.setColorAtribute(`.${viewType}-icon`);
            return;
        }

        this.popupQuizImmediately(htmlEL);


        // before: this.clearAndSend(JSON.parse(JSON.stringify(this.fullViewDescription))); // DEBUG

        // this.clearAndSend(); // DEBUG

        // this.dataOnChangeCollection();
        this.fullViewDescription.view = viewType;
        // this.resetDataCollection();

        if (this.currentViewLayout === 'xLargeCards') {
            this.canWatchScroll = false;
            document.getElementById('content').style.display = 'none';
        }

        this.removeColorAtribite(`.${this.currentViewLayout}-icon`);
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
                    httpRequestToPreform.subscribe(news => {
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
                    if (obj.category !== 'fun') {
                        this.setupNewsFeedArray(obj.news).then(() => {
                            this.googleNewsApi.storeNews(this.newsCategory, this.arr, new Date());
                        });
                    } else {
                        this.setup9GagArray(obj);
                    }
                } else {
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
        console.log(el);
        const domNode = document.createElement('div');
        domNode.innerHTML = el.description;
        if (domNode.querySelector('img') && domNode.querySelector('img').src) {
            return domNode.querySelector('img').src;
        }
        return null;
    }

    setup9GagArray(obj) {
        this.arr = [];
        let c = 0;

        return this.configureImageCaching(obj.news.rss.channel.item, true).then((imagesNeedToCache) => {
            for (const el of obj.news.rss.channel.item) {
                const urlToImage = this.extract9gagImage(el);
                if (urlToImage == null) {
                    continue;
                }
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

    toggleTheme(htmlEl = false) {
        // this.dataOnChangeCollection();
        // before: this.clearAndSend(JSON.parse(JSON.stringify(this.fullViewDescription))); // DEBUG
        // this.clearAndSend();
        this.popupQuizImmediately(htmlEl);

        if (this.currentTheme === 'light-theme') {
            this.theme.setTheme('dark-theme');
            this.upperMenuButtonsColor = 'dark';
            this.fullViewDescription.theme = 'dark-theme';
            this.changeDetector.detectChanges();
        } else {
            this.theme.setTheme('light-theme');
            this.upperMenuButtonsColor = 'light';
            this.fullViewDescription.theme = 'light-theme';
            this.changeDetector.detectChanges();
        }
        // this.resetDataCollection();
    }

    ngOnDestroy() {
        console.log("Destroying");
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

        if (this.indexSub) {
            this.indexSub.unsubscribe();
        }

        if (this.mlContextSub) {
            this.mlContextSub.unsubscribe();
        }

    }

    toggleFontSize(htmlEl = false) {
        this.popupQuizImmediately(htmlEl);

        if (this.currentViewLayout === 'gridView') {
            return;
        }

        // before: this.clearAndSend(JSON.parse(JSON.stringify(this.fullViewDescription))); // DEBUG!
        // this.clearAndSend();
        // this.dataOnChangeCollection();
        this.fontSizeDefaultB = !this.fontSizeDefaultB;

        if (this.fontSizeDefaultB) {
            this.headlinesFontSize = this.defaultFontSize;
            this.authorFontSize = this.defaultFontSize;
            this.fullViewDescription.fontSize = 'small-font';
        } else {
            this.headlinesFontSize = this.defaultFontSize + 6;
            this.authorFontSize = this.defaultFontSize + 6;
            this.fullViewDescription.fontSize = 'large-font';
        }

        this.changeDetector.detectChanges();
        // this.resetDataCollection();
    }

    // only clears and resets interval timer, no need to send data to server
    // before it was: clearAndSend(currentViewDesc)
    clearAndSend() {
        if (this.contextService.getCurrentState() === 'LAB_SAMPLING') {
            this.fullViewDescription.c = 0; // reset counter for quiz popup (same view 1min)
            clearInterval(this.dataCollectionIntervalID);
            this.dataCollectionIntervalID = null;
            /*const badView = {
                p: -2,
                r: -2,
                i: -2
            };
            console.log(currentViewDesc);
            this.contextService.sendCurrentContextToServer(this.currentContextDescription, badView, currentViewDesc); */
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
            if (this.currentViewLayout !== 'gridView') {
                // before: this.clearAndSend(JSON.parse(JSON.stringify(this.fullViewDescription))); // DEBUG!
                this.clearAndSend();
            }
        }

        if (this.currentViewLayout === 'gridView' || this.currentViewLayout === 'miniCards') {
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
            this.dataCollectionIntervalID = null;
            this.dataIntervalCollecting();
        }
    }

    resetDataLabCollection() {
        if (this.contextService.getCurrentState() === 'LAB_SAMPLING') {
            clearInterval(this.dataCollectionIntervalID);
            this.dataCollectionIntervalID = null;
            if (!this.quizIsOpened) {
                this.labDataCollecting();
            }
        }
    }

    openQuiz(b) {

        b.then((val) => {
            this.needUserFeedback = val;
            console.log('ODLOČU SM SE DA' + val);
            console.log('--------------------');
            this.mlDebug('BANDIT SAID: ' + val + ' PULL = ' + this.banditPullIndex);
            if (this.mlQuizTimeout) {
                clearTimeout(this.mlQuizTimeout);
                this.mlQuizTimeout = null;
                this.dismissAllQuizs();
            }
            if (val) {
                this.mlQuizTimeout = setTimeout(() => {
                    this.popupImmQuiz();
                }, 20000);
            } else {
                this.detectZeroReward();
            }
        });

    }

    detectZeroReward() {
        this.dismissAllQuizs();

        this.mlQuizTimeout = setTimeout(() => {

            this.contextService.getCurrentContext().pipe(take(1)).subscribe((ctx) => {
                if (ctx != null && ctx.validObjs[0] && ctx.validObjs[1] && ctx.validObjs[2]) {
                    // USER_ACTIVITY; BRIGHTNESS;THEME;LAYOUT;FONT_SIZE;BOUNDRY;P;?
                    let mlData = `${ctx.userActivityObj.types[0]};${ctx.brightnessObj.value};`;
                    mlData += `${this.topPredictedView.t};${this.topPredictedView.l};${this.topPredictedView.f};`;
                    mlData += `${this.modelDecisionBoundry};${this.topPredictedView.p};?`;

                    this.machineLearningPlugin.sendZeroReward({
                        firstTime: false,
                        username: this.userInfo.username + this.userInfo.id,
                        banditPull: this.banditPullIndex,
                        predictionDATA: mlData,
                        banditDecidedToAsk: false
                    }).then(() => {
                        console.log('Zero reward passed OK');
                    }).catch(err => {
                        console.log('Zero reward didnt pass');
                        console.log(err);
                    });

                }
            });

            clearTimeout(this.mlQuizTimeout);
            this.mlQuizTimeout = null;

        }, 20000);
    }

    popupQuizImmediately(htmlEl) {
        if (htmlEl && !this.cancelLearning) {
            const timeDiff = (new Date().getTime() - this.lastPredictionDate.getTime()) / 1000;
            console.log('MINILO JE TOLIKO SEKUND --->' + timeDiff + ' <---------------------------------');
            if (timeDiff <= 20 || this.mlQuizTimeout) {
                console.log('MORAM DT TAKOJ UPRASANJE');
                if (this.samplingType === 'SMART_SAMPLING') {
                    this.popupImmAlert();
                } else {
                    this.labTestingQuizAlert();
                }
            } else {
                console.log('NE RABM DT TAKOJ UPRASANJE');
            }
        }
    }

    trainModelWithNewData(o) {
        this.contextService.getCurrentContext().pipe(take(1)).subscribe((ctx) => {
            if (ctx != null && ctx.validObjs[0] && ctx.validObjs[1] && ctx.validObjs[2]) {
                // USER_ACTIVITY; BRIGHTNESS;THEME;LAYOUT;FONT_SIZE;BOUNDRY;P;OUTPUT

                console.log("------------------------ SENDING DATA TO SERVER ----------------------------------");

                let mlData = `${ctx.userActivityObj.types[0]};${ctx.brightnessObj.value};`;
                mlData += `${this.topPredictedView.t};${this.topPredictedView.l};${this.topPredictedView.f};`;
                mlData += `${this.modelDecisionBoundry};${this.topPredictedView.p};${o}`;
                this.mlDebug(JSON.stringify(mlData));
                this.machineLearningPlugin.trainClf({
                    firstTime: false,
                    newData: mlData,
                    banditDecidedToAsk: this.needUserFeedback,
                    banditPull: this.banditPullIndex,
                    username: this.userInfo.username + this.userInfo.id,
                    predictionDATA: mlData
                }).then((mlReturnedData) => {
                    console.log(mlReturnedData);
                    console.log('.........................');
                    if (mlReturnedData != null && mlReturnedData.s === 'busy') {
                        this.cancelLearning = true;
                    }
                });

                this.needUserFeedback = false;

            }
        });
    }

    popupImmQuiz() {
        this.dismissAllQuizs();

        clearTimeout(this.mlQuizTimeout);
        this.mlQuizTimeout = null;

        this.alertController.create({
            header: 'Ali ste zadovoljni s trenutnim prikazom novic?',
            buttons: [
                {
                    text: 'DA',
                    handler: () => {
                        this.trainModelWithNewData('Y');
                    }
                }, {
                    text: 'NE',
                    handler: () => {
                        this.trainModelWithNewData('N');
                    }
                }
            ]
        }).then((alertEl) => {
            alertEl.present();
        });

    }

    popupImmAlert() {
        this.dismissAllQuizs();

        clearTimeout(this.mlQuizTimeout);
        this.mlQuizTimeout = null;

        this.alertController.create({
            header: 'Ali ste bili zadovoljni s predhodnim prikazom novic?',
            backdropDismiss: false,
            buttons: [{
                text: 'DA',
                handler: () => {
                    this.trainModelWithNewData('Y');
                }
            }, {
                text: 'NE',
                handler: () => {
                    this.trainModelWithNewData('N');
                }
            }]
        }).then((alertEl) => {
            alertEl.present();
        });
    }

    dismissAllQuizs() {
        this.toastController.dismiss().then(() => {
            console.log('dismissed toast');
        }).catch(err => {
            console.log('error while dissmising toast controller');
            console.log(err);
        });

        this.alertController.dismiss().then(() => {
            console.log('dismissed alert controller');
        }).catch(err => {
            console.log('error while dissmising alert controller');
            console.log(err);
        });
    }


    mlDebug(d) {
        /*this.toastController.create({
            header: d,
            position: 'top',
            duration: 5000,
            color: 'light'
        }).then(toastEl => {
            toastEl.present();
        });*/
    }

    displayPrediction(str) {
        /*return this.toastController.create({
            header: str
        });*/
    }


}
