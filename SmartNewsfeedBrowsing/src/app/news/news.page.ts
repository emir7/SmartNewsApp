import { Component } from '@angular/core';
import { IonContent, LoadingController } from '@ionic/angular';

@Component({
    selector: 'app-news',
    templateUrl: 'news.page.html',
    styleUrls: ['news.page.scss'],
})
export class NewsPage {
    currentViewLayout = "largeCards";
    arr = [];
    currentVisibleElement = 0;
    canWatchScroll = true;

    constructor(public loadingController: LoadingController) {
        for (let i = 0; i < 10; i++) {
            this.arr.push(i);
        }
    }

    toggleView(viewType: string) {
        this.currentViewLayout = viewType;
    }

    displayLoadingElement() {
        return this.loadingController.create({
            message: "Loading...",
            duration: 10
        }).then(loadingEl => {
            loadingEl.present();
            document.getElementById("content").style.display = "none";
            return loadingEl.onDidDismiss();
        });
    }

    viewIsLoaded($event) {
        if ($event === "miniCardsLoaded" || $event === "largeCardsLoaded") {
            this.canWatchScroll = false;
            this.displayLoadingElement()
                .then(() => {
                    this.scrollToElement();
                });
        } else if ($event === "xLargeCardsLoaded") {
            const ionSlider = <any>document.querySelector(".activeList .slides");
            ionSlider.slideTo(this.currentVisibleElement, 500).then(() => {
                console.log("sliding ended...");
                document.getElementById("content").style.display = "block";
            });
        }
    }

    scrollToElement() {
        document.getElementById("content").style.display = "block";
        const ionContent = <any>document.querySelector("#content");
        const elements = <any>document.querySelectorAll(".activeList .card")

        ionContent.scrollToPoint(0, elements[this.currentVisibleElement].offsetTop, 500)
            .then(() => {
                console.log("scroll ended");
                this.canWatchScroll = true;
            });
    }

    onContentScroll() {
        if (this.canWatchScroll) {
            const elements = document.querySelectorAll(".activeList .card")
            for (let i = 0; i < elements.length; i++) {
                const rect = <DOMRect>elements[i].getBoundingClientRect();
                if (rect.y > 0) {
                    this.currentVisibleElement = i;
                    console.log(i);
                    break;
                }
            }
        }
    }
}
