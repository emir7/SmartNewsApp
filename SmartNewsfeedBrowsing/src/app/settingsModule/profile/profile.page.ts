import { OnInit, OnDestroy, Component } from '@angular/core';

@Component({
    selector: 'app-profile',
    templateUrl: 'profile.page.html',
    styleUrls: ['profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {

    ngOnInit() {
        console.log('ProfilePage ngOnInit');
    }

    ngOnDestroy() {
        console.log('ProfilePage ngOnDestroy');
    }

}
