import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { HomeGuard } from './shared/guards/home.guard';
import { TutorialGuard } from './shared/guards/tutorial.guard';

const routes: Routes = [
  { path: '', loadChildren: './news/news.module#NewsPageModule', pathMatch: 'full', canActivate: [HomeGuard] },
  { path: 'home', loadChildren: './news/news.module#NewsPageModule' },
  { path: 'news', loadChildren: './news/news.module#NewsPageModule' },
  { path: 'settings', loadChildren: './settingsModule/settings.module#SettingsPageModule' },
  { path: 'test', loadChildren: './sensorDataTest/sensor.test.module#SensorTestPageModule' },
  { path: 'tutorial', loadChildren: './tutorial/tutorial.module#TutorialPageModule', canActivate: [TutorialGuard] }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
