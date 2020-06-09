import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Storage } from '@ionic/storage';

export class TutorialGuard implements CanActivate {

    constructor(private storage: Storage, private router: Router) { }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | import("@angular/router").UrlTree | import("rxjs").Observable<boolean | import("@angular/router").UrlTree> | Promise<boolean | import("@angular/router").UrlTree> {
        return this.storage.get('tutorialComplete3').then((tutorialComplete) => {
            if (!tutorialComplete) {
                return true;
            }

            this.router.navigateByUrl('/');
        });
    }

}
