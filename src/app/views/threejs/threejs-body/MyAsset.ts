import { MyHelper } from "./MyHelper";
import * as THREE from 'three';

export interface MyAssetInData {
    url: string;
    height: number;
}

export class MyAsset {
    data: MyAssetInData;
    object: THREE.Object3D;
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
}