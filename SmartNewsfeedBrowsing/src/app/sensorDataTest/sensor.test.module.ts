import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SenosorTestPage } from './sensor.test.page';

const routes: Routes = [
    {
        path: "",
        component: SenosorTestPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes)
    ],
    declarations: [SenosorTestPage]
})
export class SensorTestPageModule { }
