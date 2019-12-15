import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CustomizeThemePage } from './customize.theme.page';

const routes: Routes = [
    {
        path: "",
        component: CustomizeThemePage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
    ],
    declarations: [CustomizeThemePage]
})
export class CustomizeThemePageModule { }
