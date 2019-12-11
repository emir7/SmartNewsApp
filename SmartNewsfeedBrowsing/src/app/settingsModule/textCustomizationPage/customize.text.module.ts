import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CustomizeTextPage } from './customize.text.page';

const routes: Routes = [
    {
        path: "",
        component: CustomizeTextPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
    ],
    declarations: [CustomizeTextPage]
})
export class CustomizeTextPageModule { }
