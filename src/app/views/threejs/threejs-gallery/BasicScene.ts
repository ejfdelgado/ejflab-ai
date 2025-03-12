import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import * as THREE from 'three';
import { Bone } from 'three';
//import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  CCDIKSolver,
  //IKS,
  CCDIKHelper,
} from 'three/examples/jsm/animation/CCDIKSolver.js';
import { LocalFileService } from 'ejflab-front-lib';

export interface ItemModelRef {
  url: string;
  name: string;
}

export class BasicScene extends THREE.Scene {
  // A dat.gui class debugger that is added by default
  //debugger: GUI = null;
  // Setups a scene camera
  camera: THREE.PerspectiveCamera | null = null;
  // setup renderer
  renderer: THREE.WebGLRenderer | null = null;
  // setup Orbitals
  orbitals: OrbitControls | null = null;
  // Holds the lights for easy reference
  lights: Array<THREE.Light> = [];
  // Number of PointLight objects around origin
  lightCount: number = 6;
  // Distance above ground place
  lightDistance: number = 3;
  // Get some basic params
  bounds: DOMRect;
  // FBX loader
  fbxLoader = new FBXLoader();
  gltfLoader = new GLTFLoader();
  lastObject: any = null;
  ikSolver: CCDIKSolver | null = null;

  canvasRef: HTMLCanvasElement;
  constructor(canvasRef: any, bounds: DOMRect) {
    super();
    this.canvasRef = canvasRef;
    this.bounds = bounds;
  }
  /**
   * Initializes the scene by adding lights, and the geometry
   */
  initialize(debug: boolean = true, addGridHelper: boolean = true) {
    // setup camera
    this.camera = new THREE.PerspectiveCamera(
      35,
      this.bounds.width / this.bounds.height,
      0.1,
      1000
    );
    this.camera.position.z = 12;
    this.camera.position.y = 12;
    this.camera.position.x = 12;
    // setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef,
      alpha: true,
    });
    this.renderer.setSize(this.bounds.width, this.bounds.height);
    // sets up the camera's orbital controls
    this.orbitals = new OrbitControls(this.camera, this.renderer.domElement);
    this.add(new THREE.AxesHelper(3));
    // set the background color
    this.background = new THREE.Color(0xefefef);

    const light = new THREE.AmbientLight(0xefefef, 2);
    const hemiLight = new THREE.HemisphereLight(0xefefef, 0xefefef, 2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);

    this.add(directionalLight);
    this.add(light);
    //this.add(hemiLight);
  }
  /**
   * Given a ThreeJS camera and renderer, resizes the scene if the
   * browser window is resized.
   * @param camera - a ThreeJS PerspectiveCamera object.
   * @param renderer - a subclass of a ThreeJS Renderer object.
   */
  setBounds(bounds: DOMRect) {
    this.bounds = bounds;
    if (this.camera == null || this.renderer == null) {
      return;
    }
    this.camera.aspect = this.bounds.width / this.bounds.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.bounds.width, this.bounds.height);
  }

  fitCameraToSelection(
    camera: any,
    controls: any,
    selection: any,
    fitOffset = 1.2
  ) {
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    const box = new THREE.Box3();

    box.makeEmpty();
    for (const object of selection) {
      box.expandByObject(object);
    }

    box.getSize(size);
    box.getCenter(center);

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance =
      maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = controls.target
      .clone()
      .sub(camera.position)
      .normalize()
      .multiplyScalar(distance);

    controls.maxDistance = distance * 10;
    controls.target.copy(center);

    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    camera.position.copy(controls.target).sub(direction);

    controls.update();
  }

  disableBackFaceCullingDoubleSide(model: any) {
    model.traverse(function (node: any) {
      if (node.isMesh) {
        node.material.side = THREE.DoubleSide;
      }
    });
  }

  positionBones(object: any) {
    const bone23_24: Bone = object.getObjectByName('bone-23-24');
    bone23_24.position.z = 1.5; //arriba
    bone23_24.position.y = 5; //frente
  }

  async configureIK(
    skinnedMesh: THREE.SkinnedMesh,
    fileName: string,
    localFileService: LocalFileService,
    showHelper: boolean
  ): Promise<void> {
    const partes = /([^/]+)\.[^.]+$/.exec(fileName);
    if (partes == null) {
      return;
    }
    const readed = await localFileService.readPlainText(
      `iks/${partes[1]}.json`
    );
    if (!(typeof readed == 'string')) {
      return;
    }
    const ikModel = JSON.parse(readed);
    // https://threejs.org/docs/#examples/en/animations/CCDIKSolver
    const bonesIdMap: { [key: string]: number } = {};
    // Map the bones
    const originalBones = skinnedMesh.skeleton.bones;
    if (originalBones) {
      for (let i = 0; i < originalBones.length; i++) {
        const oneBone = originalBones[i];
        bonesIdMap[oneBone.name] = i;
      }
    }

    const iteration = 5;
    const minAngle = 0;
    const maxAngle = 90;

    // Load the ik json if exists

    for (let i = 0; i < ikModel.length; i++) {
      const ikElement: any = ikModel[i];
      ikElement.iteration = iteration;
      ikElement.minAngle = minAngle;
      ikElement.maxAngle = maxAngle;
      ikElement.target = bonesIdMap[ikElement.target];
      ikElement.effector = bonesIdMap[ikElement.effector];
      const links = ikElement.links;
      for (let j = 0; j < links.length; j++) {
        const link = links[j];
        link.index = bonesIdMap[link.index];
      }
    }
    const iks: any[] = ikModel;
    this.ikSolver = new CCDIKSolver(skinnedMesh, iks);
    if (showHelper) {
      const helper2: CCDIKHelper = this.ikSolver.createHelper();
      helper2.name = 'CCDIKHelper';
      const oldHelper2 = this.getObjectByName('CCDIKHelper');
      if (oldHelper2) {
        this.remove(oldHelper2);
      }
      this.add(helper2);
    }
  }

  async configurePosition(
    object: any,
    filePath: string,
    localFileService: LocalFileService
  ) {
    const readed = await localFileService.readPlainText(filePath);
    if (!(typeof readed == 'string')) {
      return;
    }
    const positions = JSON.parse(readed);
    for (let i = 0; i < positions.length; i++) {
      const element = positions[i];
      const bone: Bone = object.getObjectByName(element.name);
      if (element.position) {
        Object.assign(bone.position, element.position);
      }
    }
  }

  async addModel(
    item: ItemModelRef,
    localFileService: LocalFileService
  ): Promise<void> {
    // Remove previous model
    if (this.lastObject != null) {
      this.remove(this.lastObject);
    }
    return new Promise((resolve, reject) => {
      const url = `${MyConstants.SRV_ROOT}${item.url.replace(/^\//g, '')}`;
      const partes = /([^.]+)$/.exec(item.url.toLocaleLowerCase());
      // gets extension
      if (partes != null) {
        const MAPEO_LOADERS: { [key: string]: any } = {
          fbx: this.fbxLoader,
          glb: this.gltfLoader,
          gltf: this.gltfLoader,
        };
        const loader: any = MAPEO_LOADERS[partes[1]];
        if (loader) {
          loader.load(
            url,
            async (response: any) => {
              let object = null;

              if (loader == this.gltfLoader) {
                object = response.scene.children[0];
              } else {
                object = response;
              }
              if (object != null) {
                this.lastObject = object;
                this.disableBackFaceCullingDoubleSide(object);
                this.add(object);
                this.fitCameraToSelection(this.camera, this.orbitals, [object]);
              }

              const temp: THREE.Object3D = object;
              const children = temp.children;
              let skinnedMesh: THREE.SkinnedMesh | null = null;

              // Find the SkinnedMesh
              for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.type == 'SkinnedMesh') {
                  skinnedMesh = child as THREE.SkinnedMesh;
                }
              }
              if (skinnedMesh) {
                await this.configureIK(
                  skinnedMesh,
                  item.url,
                  localFileService,
                  false
                );
                await this.configurePosition(
                  object,
                  'poses/hand/example.json',
                  localFileService
                );
              }
              resolve();
            },
            (xhr: any) => {
              console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            (error: any) => {
              reject(error);
            }
          );
        } else {
          alert(`No loader for ${item.url}`);
        }
      }
    });
  }
}
