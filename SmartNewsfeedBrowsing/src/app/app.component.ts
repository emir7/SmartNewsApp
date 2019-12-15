import { Component, ViewChild } from '@angular/core';

import { Platform, IonMenu } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Storage } from '@ionic/storage';
import { ThemeService } from './shared/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {

  @ViewChild('myMenu', { static: false }) menu: IonMenu;

  theme = "";
  themeSub: Subscription;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private themeService: ThemeService
  ) {

    this.initializeApp();
    this.themeService.getTheme().subscribe((currentTheme) => {
      console.log('current theme is');
      console.log(currentTheme);
      this.theme = currentTheme;
    });


  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  hideNavbar() {
    this.menu.close(true);
  }

}
