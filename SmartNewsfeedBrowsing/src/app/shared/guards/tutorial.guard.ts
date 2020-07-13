import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Storage } from '@ionic/storage';

@Injectable({
	providedIn: 'root'
})
export class TutorialGuard implements CanActivate {

    constructor(private storage: Storage, private router: Router) { }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | import("@angular/router").UrlTree | import("rxjs").Observable<boolean | import("@angular/router").UrlTree> | Promise<boolean | import("@angular/router").UrlTree> {
        return this.storage.get('tutorialComplete8').then((tutorialComplete) => {
            if (!tutorialComplete) {
                return true;
            }

            this.router.navigateByUrl('/');
        });
    }

}
