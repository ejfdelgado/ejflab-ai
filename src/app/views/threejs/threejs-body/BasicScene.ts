//import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import { BodyData, BodyKeyPointData } from './types';
/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
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
  // Poses
  poses: BodyData[] = [];

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
      const light = new THREE.PointLight(0xffffff, 1);
      let lightX =
        this.lightDistance * Math.sin(((Math.PI * 2) / this.lightCount) * i);
      let lightZ =
        this.lightDistance * Math.cos(((Math.PI * 2) / this.lightCount) * i);
      // Create a light
      light.position.set(lightX, this.lightDistance, lightZ);
      light.lookAt(0, 0, 0);
      this.add(light);
      this.lights.push(light);
      // Visual helpers to indicate light positions
      this.add(new THREE.PointLightHelper(light, 0.5, 0xff9900));
    }

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

  vector3DAll: THREE.Vector3[][] = [];

  get3DVectorBody(index: number): THREE.Vector3[] {
    const scale = 10;
    const offset = new THREE.Vector3(-scale / 2, -scale / 2, 0);
    let response: THREE.Vector3[] = [];

    const originalData = this.poses[index];
    const original = originalData.keypoints3D;
    response = this.vector3DAll[index];

    function transform(landmark: BodyKeyPointData) {
      return {
        x: landmark.x * scale + offset.x,
        y: (1 - landmark.y) * scale + offset.y, // Flip y-axis for Three.js
        z: landmark.z * scale,
      };
    }

    if (response == undefined) {
      response = [];
      response = original.map(landmark => {
        const temp = transform(landmark);
        return new THREE.Vector3(temp.x, temp.y, temp.z);
      });
      this.vector3DAll[index] = response;
    } else {
      // Replace values
      original.forEach((landmark, i) => {
        const temp = transform(landmark);
        response[i].set(temp.x, temp.y, temp.z);
      });
    }

    return response;
  }

  updatePoses(poses: BodyData[]) {
    this.poses = poses;
    for (let i = 0; i < poses.length; i++) {
      const vectors: THREE.Vector3[] = this.get3DVectorBody(i);
    }
  }
}
