//import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
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
    // Creates the geometry + materials
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xff9900 });
    let cube = new THREE.Mesh(geometry, material);
    cube.position.y = 0.5;
    // add to scene
    this.add(cube);
    // setup Debugger
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
}
