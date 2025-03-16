import { BodyKeyPointData, BodyState } from "./types";

export class WalkBody {
    sideState: number = 1;
    maxValue: number = 0;
    MOVEMENT_THRESHOLD = 0.1;
    maxDifference: number = 0;
    lastStep: number = 0;

    capture(points: BodyKeyPointData[], bodyPointMapIndex: { [key: string]: number }, state: BodyState) {
        const leftHeelIx = bodyPointMapIndex['left_heel'];
        const rightHeelIx = bodyPointMapIndex['right_heel'];
        if (!leftHeelIx || !rightHeelIx) {
            return;
        }
        const leftHeight = points[leftHeelIx].y;
        const rightHeight = points[rightHeelIx].y;
        const difference = leftHeight - rightHeight;
        const differenceAbs = Math.abs(difference);
        
        if (differenceAbs > this.MOVEMENT_THRESHOLD) {
            
            if (difference > 0) {
                // left
                if (this.sideState == 2) {
                    this.lastStep = this.maxDifference;
                    this.maxDifference = 0;
                }
                this.sideState = 1;
            } else {
                //right
                if (this.sideState == 1) {
                    this.lastStep = this.maxDifference;
                    this.maxDifference = 0;
                }
                this.sideState = 2;
            }
            this.maxDifference = Math.max(this.maxDifference, differenceAbs);
        }
        state.data.difference = difference;
        state.data.sideState = this.sideState;
        state.data.lastStep = this.lastStep;
    }
}