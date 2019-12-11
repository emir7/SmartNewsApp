import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { PowerSavingPage } from './power.saving.page';

const routes: Routes = [
    {
        path: "",
        component: PowerSavingPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
    ],
    declarations: [PowerSavingPage]
})
export class PowerSavingPageModule { }
