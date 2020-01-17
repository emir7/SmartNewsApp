import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NewsPage } from './news.page';
import { MiniCardComponent } from './miniCardComponent/mini.card.component';
import { LargeCardComponent } from './largeCardComponent/large.card.component';
import { XLargeCardComponent } from './xLargeCardComponent/xlarge.card.component';
import { GridViewComponent } from './gridViewComponent/grid.view.component';
import { HttpClientModule } from '@angular/common/http';
import { GoogleNewsApiService } from '../shared/google.news.api.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { IndexSlideService } from '../shared/index.slide.service';
import { PopoverComponent } from './popoverComponent/popover.component';
import { GagNewsApiService } from '../shared/gag.news.api.service';
import { FileModal } from './modalFile/file.modal.data';

const routes: Routes = [
    {
        path: "",
        component: NewsPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        HttpClientModule
    ],

    providers: [GoogleNewsApiService, InAppBrowser, IndexSlideService, GagNewsApiService],
    entryComponents: [PopoverComponent, FileModal],
    declarations: [NewsPage, MiniCardComponent, LargeCardComponent, XLargeCardComponent, GridViewComponent, PopoverComponent, FileModal]
})
export class NewsPageModule { }
