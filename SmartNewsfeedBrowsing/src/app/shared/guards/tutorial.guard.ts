import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Storage } from '@ionic/storage';

export class TutoralGuard implements CanActivate {

    constructor(private storage: Storage, private router: Router) { }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | import("@angular/router").UrlTree | import("rxjs").Observable<boolean | import("@angular/router").UrlTree> | Promise<boolean | import("@angular/router").UrlTree> {
        return this.storage.get('tutorialComplete').then((tutorialComplete) => {
            if (!tutorialComplete) {
                this.router.navigateByUrl('/tutorial');
            }

            return tutorialComplete;

        });
    }

}