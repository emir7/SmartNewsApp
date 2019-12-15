import { OnInit, OnDestroy, Component } from '@angular/core';

@Component({
    selector: 'app-theme',
    templateUrl: 'customize.theme.page.html',
    styleUrls: ['customize.theme.page.scss'],
})
export class CustomizeThemePage implements OnInit, OnDestroy {

    ngOnInit() {
        console.log('CustomizeThemePage ngOnInit');
    }

    ngOnDestroy() {
        console.log('CustomizeThemePage ngOnDestroy');
    }

}
