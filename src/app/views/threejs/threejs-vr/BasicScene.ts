import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import * as THREE from 'three';
//import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory';
/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export class BasicScene extends THREE.Scene {
  AXIS_Y = new THREE.Vector3(0, 1, 0);
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
  // VR Button
  vrButton: HTMLElement | null = null;
  fbxLoader = new FBXLoader();

  controller1: THREE.XRTargetRaySpace | null;
  controller2: THREE.XRTargetRaySpace | null;
  controllerGrip1: THREE.XRGripSpace | null;
  controllerGrip2: THREE.XRGripSpace | null;
  hand1: THREE.XRHandSpace | null;
  hand2: THREE.XRHandSpace | null;

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
    const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef,
      alpha: true,
      antialias: true,
    });
    this.renderer = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.xr.enabled = true; // Enable VR
    renderer.setSize(this.bounds.width, this.bounds.height);

    this.vrButton = VRButton.createButton(renderer);

    // sets up the camera's orbital controls
    this.orbitals = new OrbitControls(this.camera, renderer.domElement);
    // Adds an origin-centered grid for visual reference
    if (addGridHelper) {
      // Adds a grid
      this.add(new THREE.GridHelper(10, 10, 'red'));
      // Adds an axis-helper
      this.add(new THREE.AxesHelper(3));
    }
    // set the background color
    this.background = new THREE.Color(0xefefef);
    // create the lights
    for (let i = 0; i < this.lightCount; i++) {
      // Positions evenly in a circle pointed at the origin
      const light = new THREE.PointLight(0xffffff, 10);
      let lightX =
        this.lightDistance * Math.sin(((Math.PI * 2) / this.lightCount) * i);
      let lightZ =
        this.lightDistance * Math.cos(((Math.PI * 2) / this.lightCount) * i);
      // Create a light
      light.position.set(lightX, this.lightDistance, lightZ);
      light.lookAt(0, 0, 0);
      this.add(light);
      this.lights.push(light);
    }

    //Controllers
    this.controller1 = renderer.xr.getController(0);
    this.add(this.controller1);
    this.controller2 = renderer.xr.getController(1);
    this.add(this.controller2);

    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    // Hand 1
    this.controllerGrip1 = renderer.xr.getControllerGrip(0);
    this.controllerGrip1.add(
      controllerModelFactory.createControllerModel(this.controllerGrip1)
    );
    this.add(this.controllerGrip1);
    this.hand1 = renderer.xr.getHand(0);
    this.hand1.add(handModelFactory.createHandModel(this.hand1));

    this.add(this.hand1);

    // Hand 2
    this.controllerGrip2 = renderer.xr.getControllerGrip(1);
    this.controllerGrip2.add(
      controllerModelFactory.createControllerModel(this.controllerGrip2)
    );
    this.add(this.controllerGrip2);
    this.hand2 = renderer.xr.getHand(1);
    this.hand2.add(handModelFactory.createHandModel(this.hand2));
    this.add(this.hand2);
  }

  getColorFromId(id: string) {
    // TODO
    return 0xff9900;
  }

  async addFBXModel(): Promise<any> {
    // Remove previous model
    return new Promise((resolve, reject) => {
      const url = `${MyConstants.SRV_ROOT}assets/3d/character/simple.fbx`;
      this.fbxLoader.load(
        url,
        (object: any) => {
          resolve(object);
        },
        (xhr: any) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  setMaterial(object: THREE.Object3D, material: THREE.MeshBasicMaterial) {
    for (let i = 0; i < object.children.length; i++) {
      const child = object.children[i];
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = material;
      }
    }
  }

  async createCubeWithId(id: string): Promise<THREE.Object3D<any>> {
    //Assign a color for the given id hash
    const material = new THREE.MeshPhongMaterial({
      color: this.getColorFromId(id),
    });
    let cube = await this.addFBXModel();
    cube.name = id;
    //this.setMaterial(cube, material);
    //cube.position.y = 0.5;
    const check = this.getObjectByName(id);
    if (!check) {
      this.add(cube);
      return cube;
    } else {
      return check;
    }
  }

  async getCubeById(id: string): Promise<THREE.Object3D<any>> {
    // Check if the entity exists
    let cube = this.getObjectByName(id);
    if (!cube) {
      cube = await this.createCubeWithId(id);
    }
    return cube;
  }

  async getEntityValue(id: string, key: string): Promise<any> {
    const cube = await this.getCubeById(id);
    if (key == 'position') {
      return Object.assign({}, cube.position);
    } else if (key == 'rotation') {
      return Object.assign({}, cube.rotation);
    }
  }

  async setEntityValue(id: string, key: string, value: any, isMe: boolean) {
    const cube = await this.getCubeById(id);
    if (key == 'position') {
      Object.assign(cube.position, value);
    } else if (key == 'rotation') {
      Object.assign(cube.rotation, value);
    } else if (key == 'headset') {
      Object.assign(cube.position, value.position);
      cube.setRotationFromQuaternion(
        new THREE.Quaternion().fromArray(value.rotation, 0)
      );
      // Place hands
      if (!isMe) {
        this.placeHandInSpace(id, 'hand1', value);
        this.placeHandInSpace(id, 'hand2', value);
      }
    }
  }

  placeHandInSpace(id: string, key: string, value: any) {
    if (value[key] instanceof Array) {
      let oneJoin = this.getObjectByName(`${id}.${key}.0`);
      if (!oneJoin) {
        this.createHandPoints(id, key);
      }
      for (let i = 0; i < value[key].length; i++) {
        const jointValue = value[key][i];
        oneJoin = this.getObjectByName(`${id}.${key}.${i}`);
        if (oneJoin) {
          Object.assign(oneJoin.position, jointValue);
        }
      }
    }
  }

  setBounds(bounds: DOMRect) {
    this.bounds = bounds;
    if (this.camera == null || this.renderer == null) {
      return;
    }
    this.camera.aspect = this.bounds.width / this.bounds.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.bounds.width, this.bounds.height);
  }

  createHandPoints(avatarId: string, handId: string) {
    const side = 0.01;
    for (let i = 0; i < 25; i++) {
      const geometry = new THREE.SphereGeometry(side, 4, 4);
      const material = new THREE.MeshPhongMaterial({ color: 0x0000aa });
      let object = new THREE.Mesh(geometry, material);
      object.name = `${avatarId}.${handId}.${i}`;
      this.add(object);
    }
  }
}
