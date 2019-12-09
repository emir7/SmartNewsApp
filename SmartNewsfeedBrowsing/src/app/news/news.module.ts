import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NewsPage } from './news.page';
import { MiniCardComponent } from './miniCardComponent/mini.card.component';
import { LargeCardComponent } from './largeCardComponent/large.card.component';
import { XLargeCardComponent } from './xLargeCardComponent/xlarge.card.component';

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
        RouterModule.forChild(routes)
    ],
    exports: [MiniCardComponent],
    declarations: [NewsPage, MiniCardComponent, LargeCardComponent, XLargeCardComponent],
    entryComponents: [MiniCardComponent]
})
export class NewsPageModule { }
