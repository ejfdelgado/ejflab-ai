import { MyHelper } from "./MyHelper";
import * as THREE from 'three';

export interface MyAssetInData {
    url: string;
    height: number;
}

export class MyAsset {
    data: MyAssetInData;
    object: THREE.Object3D;
    matrix: THREE.Matrix4;
    constructor(data: MyAssetInData) {
        this.data = data;
    }

    async initialize() {
        MyHelper.loadGLTFModel(this.data.url);

        this.object = await MyHelper.loadGLTFModel("/assets/models/assets/ball.glb");
        MyHelper.scaleMeshToHeight(this.object, this.data.height);
        MyHelper.makeMaterialsEmissive(this.object);
    }

    getMesh(): THREE.Object3D {
        return this.object;
    }

    makeRandomPosition(min: THREE.Vector2, max: THREE.Vector2) {
        const posX = min.x + Math.random() * (max.x - min.x);
        const posZ = min.y + Math.random() * (max.y - min.y);
        this.matrix = new THREE.Matrix4().makeTranslation(posX, 0, posZ);
        this.object.applyMatrix4(this.matrix);
        this.object.matrixAutoUpdate = false;
    }
}