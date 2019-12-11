import { OnInit, OnDestroy, Component } from '@angular/core';

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.page.html',
    styleUrls: ['settings.page.scss'],
})
export class SettingsPage implements OnInit, OnDestroy {

    ngOnInit() {
        console.log('SettingsPage ngOnInit');
    }

    ngOnDestroy() {
        console.log('SettingsPage ngOnDestroy');
    }

}
