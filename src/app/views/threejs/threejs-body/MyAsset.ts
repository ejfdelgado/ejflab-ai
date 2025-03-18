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
    scale: number;
    box: THREE.Box3;
    constructor(data: MyAssetInData) {
        this.data = data;
    }

    async initialize() {
        MyHelper.loadGLTFModel(this.data.url);

        this.object = await MyHelper.loadGLTFModel("/assets/models/assets/ball.glb");
        this.object.matrixAutoUpdate = false;
        const temp = MyHelper.scaleMeshToHeight(this.object, this.data.height);
        if (temp) {
            this.box = temp.box;
            this.scale = temp.scale;
        }
        MyHelper.makeMaterialsEmissive(this.object);
    }

    getMesh(): THREE.Object3D {
        return this.object;
    }

    setPosition(x: number, z: number) {
        const translation = new THREE.Matrix4().makeTranslation(x, 0, z);
        const scale = new THREE.Matrix4().makeScale(this.scale, this.scale, this.scale);
        this.matrix = new THREE.Matrix4().multiplyMatrices(translation, scale);
        this.object.applyMatrix4(this.matrix);
    }

    makeRandomPosition(min: THREE.Vector2, max: THREE.Vector2) {
        const x = min.x + Math.random() * (max.x - min.x);
        const z = min.y + Math.random() * (max.y - min.y);
        this.setPosition(x, z);
    }
}