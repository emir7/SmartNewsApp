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

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, IonicStorageModule.forRoot()],
  providers: [
    StatusBar,
    SplashScreen,
    FontSizeService,
    PerformanceService,
    SensorReadingService,
    Network,
    BatteryStatus,
    InAppBrowser,
    ThemeService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
