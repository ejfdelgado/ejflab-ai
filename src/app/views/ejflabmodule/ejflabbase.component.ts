import {
    Component,
} from '@angular/core';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';

@Component({
    selector: 'app-ejflabbase',
    template: ` <div></div> `,
    styles: [],
})
export abstract class EjflabBaseComponent {
    start: number = 0;
    seconds: string = '';
    getRoot(): string {
        return MyConstants.SRV_ROOT;
    }
    tic() {
        this.start = new Date().getTime();
    }
    toc() {
        const end = new Date().getTime();
        const duration = ((end - this.start) / 1000).toFixed(2);
        this.seconds = `${duration} seconds`;
    }
}