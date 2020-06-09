import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FontSizeService } from './shared/font.service';
import { PerformanceService } from './shared/performance.service';

import { IonicStorageModule } from '@ionic/storage';
import { Network } from '@ionic-native/network/ngx';
import { ThemeService } from './shared/theme.service';
import { SensorReadingService } from './shared/sensor.reading.service';
import { BatteryStatus } from '@ionic-native/battery-status/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { HomeGuard } from './shared/guards/home.guard';
import { TutorialGuard } from './shared/guards/tutorial.guard';
import { HttpClientModule } from '@angular/common/http';

import { StreamingMedia } from '@ionic-native/streaming-media/ngx';
import { File } from '@ionic-native/file/ngx';
import { HttpClient } from '@angular/common/http';
import { ActionCounterService } from './shared/action.counter.service';
import { MlService } from './shared/ml.service';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, IonicStorageModule.forRoot()],
  providers: [
    StatusBar,
    SplashScreen,
    FontSizeService,
    PerformanceService,
    SensorReadingService,
    ActionCounterService,
    MlService,
    Network,
    BatteryStatus,
    InAppBrowser,
    ThemeService,
    HomeGuard,
    TutorialGuard,
    StreamingMedia,
    File,
    HttpClient,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
