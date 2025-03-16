import * as THREE from 'three';
import { BodyKeyPointData, BodyState } from "./types";

export class WalkBody {
    sideState: number = 1;
    maxValue: number = 0;
    MOVEMENT_THRESHOLD = 0.05;
    maxDifference: number = 0;
    lastStep: number = 0;
    STEP_AMOUNT: number = 2;
    ROTATION_AMOUNT: number = 0.25;
    FRONT_REFERENCE = new THREE.Vector3(-1, 0, 0);
    UP_REFERENCE = new THREE.Vector3(0, 1, 0);
    front = new THREE.Vector3(0, 0, 0);
    cameraSmoot = new THREE.Vector3(0, 0, 0);
    lastCameraSmoot: number = new Date().getTime();

    lookAtActual = new THREE.Vector3(0, 0, 0);
    lookAtDestination = new THREE.Vector3(0, 0, 0);
    lookAtLastT: number = new Date().getTime();

    translationX: number = 0;
    translationZ: number = 0;
    rotationY: number = 0;//radians
    public transformationMatrix: THREE.Matrix4 = new THREE.Matrix4().identity();

    placeCamera(camera: THREE.PerspectiveCamera, state: BodyState) {
        // Compute the location behind the avatar
        // Compute the avatar height
        this.cameraSmoot.y = state.data['height'] * 2;
        const advanceFront = this.FRONT_REFERENCE.clone().applyAxisAngle(this.UP_REFERENCE, this.rotationY).normalize();
        this.cameraSmoot.x = this.translationX - advanceFront.x * 15;
        this.cameraSmoot.z = this.translationZ - advanceFront.z * 15;

        this.lastCameraSmoot = this.makeSmoot(camera.position, this.cameraSmoot, this.lastCameraSmoot);
        this.lookAtDestination.setX(this.translationX);
        this.lookAtDestination.setY(state.data['height']);
        this.lookAtDestination.setZ(this.translationZ);
        this.lookAtLastT = this.makeSmoot(this.lookAtActual, this.lookAtDestination, this.lookAtLastT);

        camera.lookAt(this.lookAtActual.x, this.lookAtActual.y, this.lookAtActual.z);

    }

    makeSmoot(actual: THREE.Vector3, destination: THREE.Vector3, lastTime: number) {
        const actualT = new Date().getTime();
        const diffTime = actualT - lastTime;

        const trayectoria = new THREE.Vector3(
            destination.x - actual.x,
            destination.y - actual.y,
            destination.z - actual.z,
        );
        const length = trayectoria.length();
        trayectoria.normalize();
        const thisStep = diffTime * 0.006;
        const currentStep = Math.min(thisStep, length);
        if (currentStep >= 0.0001) {
            trayectoria.multiplyScalar(currentStep);
            actual.x += trayectoria.x;
            actual.y += trayectoria.y;
            actual.z += trayectoria.z;
        } else {
            actual.x = destination.x;
            actual.y = destination.y;
            actual.z = destination.z;
        }
        return actualT;
    }

    capture(points: THREE.Vector3[], bodyPointMapIndex: { [key: string]: number }, state: BodyState) {
        this.computeFront(points, bodyPointMapIndex, state);

        const noseIx = bodyPointMapIndex['nose'];
        const noseHeight = points[noseIx].y;
        state.data['height'] = noseHeight;

        const leftHeelIx = bodyPointMapIndex['left_heel'];
        const rightHeelIx = bodyPointMapIndex['right_heel'];
        const leftHeight = points[leftHeelIx].y;
        const rightHeight = points[rightHeelIx].y;
        const difference = leftHeight - rightHeight;
        const differenceAbs = Math.abs(difference);
        let makeStep = false;

        if (differenceAbs > this.MOVEMENT_THRESHOLD) {

            if (difference > 0) {
                // left
                if (this.sideState == 2) {
                    this.lastStep = this.maxDifference;
                    this.maxDifference = 0;
                    makeStep = true;
                }
                this.sideState = 1;
            } else {
                //right
                if (this.sideState == 1) {
                    this.lastStep = this.maxDifference;
                    this.maxDifference = 0;
                    makeStep = true;
                }
                this.sideState = 2;
            }
            this.maxDifference = Math.max(this.maxDifference, differenceAbs);
        }
        state.data.difference = difference * 10;
        state.data.sideState = this.sideState;
        state.data.lastStep = this.lastStep * 10;

        if (makeStep) {
            this.rotationY += state.data['angle'] * this.ROTATION_AMOUNT;
            const advanceFront = this.FRONT_REFERENCE.clone().applyAxisAngle(this.UP_REFERENCE, this.rotationY).normalize();
            this.translationX += advanceFront.x * this.lastStep * this.STEP_AMOUNT;
            this.translationZ += advanceFront.z * this.lastStep * this.STEP_AMOUNT;
            const translationMatrix = new THREE.Matrix4().makeTranslation(this.translationX, 0, this.translationZ);
            const rotationMatrix = new THREE.Matrix4().makeRotationY(this.rotationY);
            this.transformationMatrix = new THREE.Matrix4().multiplyMatrices(translationMatrix, rotationMatrix);
        }

        state.data['trans'] = {
            'rotationY': this.rotationY * 180 / Math.PI,
            'translationX': this.translationX,
            'translationZ': this.translationZ,
        };
    }

    getVector(point: BodyKeyPointData) {
        return new THREE.Vector3(point.x, point.y, point.z);
    }

    computeFront(points: THREE.Vector3[], bodyPointMapIndex: { [key: string]: number }, state: BodyState) {
        const left_shoulderIx = bodyPointMapIndex['left_shoulder'];
        const right_shoulderIx = bodyPointMapIndex['right_shoulder'];
        const left_hipIx = bodyPointMapIndex['left_hip'];
        const right_hipIx = bodyPointMapIndex['right_hip'];

        const left_shoulder = points[left_shoulderIx];
        const right_shoulder = points[right_shoulderIx];
        const left_hip = points[left_hipIx];
        const right_hip = points[right_hipIx];

        const v1 = new THREE.Vector3(left_hip.x - right_hip.x, left_hip.y - right_hip.y, left_hip.z - right_hip.z);
        const v2 = new THREE.Vector3(right_shoulder.x - right_hip.x, right_shoulder.y - right_hip.y, right_shoulder.z - right_hip.z);
        const front1 = new THREE.Vector3().crossVectors(v1, v2).normalize();

        const v1p = new THREE.Vector3(right_shoulder.x - left_shoulder.x, right_shoulder.y - left_shoulder.y, right_shoulder.z - left_shoulder.z);
        const v2p = new THREE.Vector3(left_hip.x - left_shoulder.x, left_hip.y - left_shoulder.y, left_hip.z - left_shoulder.z);
        const front2 = new THREE.Vector3().crossVectors(v1p, v2p).normalize();

        this.front.setX((front1.x + front2.x) / 2);
        this.front.setY(0);
        this.front.setZ((front1.z + front2.z) / 2);
        this.front.normalize();

        const angle = this.FRONT_REFERENCE.angleTo(this.front);
        state.data['front'] = {
            x: this.front.x,
            z: this.front.z,
        };
        state.data['angle'] = (this.front.z < 0 ? -1 : 1) * angle;
        state.data['angle_deg'] = state.data['angle'] * 180 / Math.PI;
    }
}