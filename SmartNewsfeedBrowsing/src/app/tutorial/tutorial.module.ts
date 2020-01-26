import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { TutorialPage } from './tutorial.page'


const routes: Routes = [
    {
        path: '',
        component: TutorialPage
    }
]

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes)
    ],
    declarations: [TutorialPage]
})
export class TutorialPageModule { }
