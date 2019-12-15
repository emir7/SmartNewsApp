import { SettingsPage } from './settings.page';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';

const routes: Routes = [
    {
        path: "",
        component: SettingsPage
    },
    {
        path: 'customize/text',
        loadChildren: './textCustomizationPage/customize.text.module#CustomizeTextPageModule'
    },
    {
        path: 'customize/powermanagment',
        loadChildren: './powerSavingPage/power.saving.module#PowerSavingPageModule'
    },
    {
        path: 'profile',
        loadChildren: './profile/profile.module#ProfilePageModule'
    },
    {
        path: 'customize/theme',
        loadChildren: './themeCustomizationPage/customize.theme.module#CustomizeThemePageModule'
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes)
    ],
    declarations: [SettingsPage]
})
export class SettingsPageModule { }
