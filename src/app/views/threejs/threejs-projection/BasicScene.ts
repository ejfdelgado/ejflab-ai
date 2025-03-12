import * as THREE from 'three';
//import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { BufferAttribute, Camera, Object3D } from 'three';
import { EventEmitter } from '@angular/core';
import { VideoCanvasEventData } from 'src/app/views/projection/components/video-canvas/video-canvas.component';
import { Model3DDataKey } from 'src/app/views/projection/projection.component';

export interface DotModelData {
  v3: { x: number; y: number; z: number };
  v2?: { x: number; y: number };
}

export interface KeyValueDotModelData {
  key: string;
  value: DotModelData;
}

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export class BasicScene extends THREE.Scene {
  PRECISION = 5;
  MARKER_SIZE = 0.1;
  camera: THREE.PerspectiveCamera | null = null;
  renderer: THREE.WebGLRenderer | null = null;
  orbitals: OrbitControls | null = null;
  lights: Array<THREE.Light> = [];
  lightCount: number = 6;
  lightDistance: number = 3;
  bounds: DOMRect;
  viewOffset: number = 0;
  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();
  pickableObjects: THREE.Mesh[] = [];
  intersectedObject: THREE.Object3D | null = null;
  selectedObjectName: string | null = null;
  defaultMaterial: THREE.MeshPhongMaterial | null = null;
  normalMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  selectedMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  highlightedMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x00ff00,
  });
  public dot3DSelected = new EventEmitter<KeyValueDotModelData | null>();
  seeCalibPoints: boolean = false;
  registry: Array<THREE.Group> = [];
  vertexRegistry: { [key: string]: { [key: string]: any } } = {};

  canvasRef: HTMLCanvasElement;
  constructor(canvasRef: any, bounds: DOMRect) {
    super();
    this.canvasRef = canvasRef;
    this.bounds = bounds;
  }

  setSeeCalibPoints(value: boolean) {
    this.seeCalibPoints = value;
  }

  // Called for ever
  update(): void {
    if (!this.camera) {
      return;
    }
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pickableObjects);

    let intersectedEl = null;
    if (intersects.length > 0) {
      intersectedEl = intersects[0];
      this.intersectedObject = intersectedEl.object;
    } else {
      this.intersectedObject = null;
    }
    this.pickableObjects.forEach((o: THREE.Mesh, i) => {
      const current = this.pickableObjects[i];
      if (current.name == this.selectedObjectName) {
        current.material = this.selectedMaterial;
      } else {
        if (this.intersectedObject && this.intersectedObject.name === o.name) {
          current.material = this.highlightedMaterial;
        } else {
          current.material = this.normalMaterial;
        }
      }
    });
  }

  resetCameraTecnic1() {
    if (!this.camera) {
      return;
    }
    this.camera.matrix
      .identity()
      .decompose(
        this.camera.position,
        this.camera.quaternion,
        this.camera.scale
      );
  }

  resetView() {
    if (!this.camera) {
      return;
    }
    this.camera.zoom = 1;
    this.setOrbitControls(false);
    this.setOrbitControls(true);
    this.camera.updateProjectionMatrix();
  }

  setFov(fov: number) {
    if (!this.camera) {
      return;
    }
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  // https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset
  setViewOffset(offset: number | null) {
    if (!this.camera || !this.renderer) {
      return;
    }
    if (offset == null) {
      offset = this.viewOffset;
    } else {
      if (isNaN(offset)) {
        offset = 0;
      }
      this.viewOffset = offset;
    }
    this.camera.clearViewOffset();
    this.setBounds(this.bounds);
    if (offset > 0) {
      const physicalWidth = this.camera.getFilmWidth();
      const physicalHeight = this.camera.getFilmHeight();
      const realHeight = (offset + 0.5) * physicalHeight * 2;
      this.camera.setViewOffset(
        physicalWidth,
        realHeight,
        0,
        0,
        physicalWidth,
        physicalHeight
      );
    }
    this.camera.updateProjectionMatrix();
  }

  resetCameraTecnic2(invertUp: boolean) {
    if (!this.camera) {
      return;
    }
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 0;

    if (invertUp) {
      this.camera.up = new THREE.Vector3(0, 1, 0);
      this.camera.lookAt(new THREE.Vector3(0, 0, -1));
    } else {
      this.camera.up = new THREE.Vector3(0, -1, 0);
      this.camera.lookAt(new THREE.Vector3(0, 0, 1));
    }

    this.camera.updateMatrix();
  }

  calibCamera(t: Array<Array<number>>) {
    if (!this.camera) {
      return;
    }
    let projectionMatrix = new THREE.Matrix4();
    projectionMatrix.set(
      t[0][0],
      t[1][0],
      t[2][0],
      t[3][0],
      t[0][1],
      t[1][1],
      t[2][1],
      t[3][1],
      t[0][2],
      t[1][2],
      t[2][2],
      t[3][2],
      t[0][3],
      t[1][3],
      t[2][3],
      t[3][3]
    );

    this.setOrbitControls(false);

    this.resetCameraTecnic2(false);
    this.camera.applyMatrix4(projectionMatrix);
    this.camera.updateProjectionMatrix();
    setTimeout(() => {
      this.setViewOffset(null);
    }, 0);
  }

  getSelectedVertex(): KeyValueDotModelData | null {
    if (this.selectedObjectName) {
      const object = this.getObjectByName(this.selectedObjectName);
      if (object) {
        return {
          key: this.selectedObjectName,
          value: {
            v3: {
              x: object.position.x,
              y: object.position.y,
              z: object.position.z,
            },
          },
        };
      }
    }
    return null;
  }

  selectKeyPoint(key: string) {
    this.selectedObjectName = key;
  }

  onMouseClick(event: MouseEvent, bounds: DOMRect) {
    if (!this.renderer || !this.camera) {
      return;
    }
    if (event.shiftKey) {
      // Se debe seleccionar el vertice actual si lo hay...
      if (this.intersectedObject) {
        this.selectedObjectName = this.intersectedObject.name;
        //console.log(`this.selectedObjectName = ${this.selectedObjectName}`);
        this.dot3DSelected.emit({
          key: this.selectedObjectName,
          value: {
            v3: {
              x: this.intersectedObject.position.x,
              y: this.intersectedObject.position.y,
              z: this.intersectedObject.position.z,
            },
          },
        });
      } else {
        this.selectedObjectName = null;
        this.dot3DSelected.emit(null);
      }
    }
  }

  onMouseMove(event: MouseEvent, bounds: DOMRect) {
    if (!this.renderer) {
      return;
    }
    this.mouse.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    );
  }

  removeAllMyObjects() {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const obj = this.children[i];
      this.remove(obj);
    }
    this.registry = [];
  }

  removeObjectByName(uid: string) {
    const found: any = this.getObjectByName(uid);
    if (found) {
      const indice = this.registry.indexOf(found);
      if (indice >= 0) {
        this.registry.splice(indice, 1);
      } else {
        console.log(`object ${uid} is not in the registry`);
      }
      this.remove(found);
    } else {
      console.log(`object ${uid} not found`);
    }
  }

  //await this.loadObj('/assets/3d/mycube/mycube.obj', 'uid');
  async loadObj(
    path: string,
    uid: string,
    materials?: MTLLoader.MaterialCreator,
    isVisible = true
  ): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const loader = new OBJLoader();
      if (materials) {
        loader.setMaterials(materials);
      }
      loader.load(
        path,
        (object) => {
          object.name = uid;
          object.visible = isVisible;
          this.addObjectLocal(object);
          resolve(object);
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        function (error) {
          reject(error);
        }
      );
    });
  }

  // await this.loadObjMtl('/assets/3d/mycube/mycube.obj', 'uid','/assets/3d/mycube/mycube.mtl');
  async loadObjMtl(pathObj: string, pathMtl: string, uid: string) {
    return new Promise((resolve, reject) => {
      const mtlLoader = new MTLLoader();
      mtlLoader.load(
        pathMtl,
        async (materials) => {
          materials.preload();
          try {
            const model = await this.loadObj(pathObj, uid, materials);
            resolve(model);
          } catch (err) {
            reject(err);
          }
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  addCubeVertex(point: THREE.Vector3, name: string, visible: boolean = true) {
    const key = [
      point.x.toFixed(this.PRECISION),
      point.y.toFixed(this.PRECISION),
      point.z.toFixed(this.PRECISION),
    ]
      .join('_')
      .replace(/[-]/g, '_')
      .replace(/[\.]/g, '_');
    const generatedName = `DOT_${key}`;
    const found = this.getObjectByName(generatedName);
    if (!found) {
      const geometry = new THREE.BoxGeometry(
        this.MARKER_SIZE,
        this.MARKER_SIZE,
        this.MARKER_SIZE
      );
      const cube = new THREE.Mesh(geometry, this.normalMaterial);
      cube.name = generatedName;
      cube.position.set(point.x, point.y, point.z);
      this.pickableObjects.push(cube);
      cube.visible = this.seeCalibPoints && visible !== false;
      this.add(cube);
      if (!(name in this.vertexRegistry)) {
        this.vertexRegistry[name] = {};
      }
      this.vertexRegistry[name][generatedName] = cube;
    }
  }

  explodeMeshVertex(mesh: THREE.Mesh, name: string, visible: boolean = true) {
    // Iterate vertex
    const point = new THREE.Vector3();
    const positionAttribute: any = mesh.geometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
      point.fromBufferAttribute(positionAttribute, i);
      mesh.localToWorld(point);
      this.addCubeVertex(point, name, visible);
    }
  }

  assignMaterial(event: VideoCanvasEventData) {
    const uid = event.uid;
    const found: any = this.getObjectByName(uid);
    if (found) {
      const videoTexture = new THREE.VideoTexture(event.video);
      //videoTexture.encoding = THREE.sRGBEncoding;
      videoTexture.needsUpdate = true;
      const videoMaterial = new THREE.MeshPhongMaterial({
        map: videoTexture,
        emissiveMap: videoTexture,
        side: THREE.FrontSide,
        emissive: 0xffffff,
        emissiveIntensity: 1,
      });
      videoMaterial.needsUpdate = true;
      //videoMaterial.side = THREE.DoubleSide;
      videoMaterial.side = THREE.FrontSide;
      //videoMaterial.side = THREE.BackSide;
      found.traverse(function (child: any) {
        if (child instanceof THREE.Mesh) {
          child.material = videoMaterial;
        }
      });
    }
  }

  setObjectVisibility(name: string, value: boolean) {
    const existente = this.getObjectByName(name);
    if (!existente) {
      return;
    }
    existente.visible = value;
    // Se buscan los vertices y se les asigna el mismo valor...
    const vertices = this.vertexRegistry[name];
    if (vertices) {
      const llaves = Object.keys(vertices);
      for (let j = 0; j < llaves.length; j++) {
        const llave = llaves[j];
        const vertice = this.getObjectByName(llave);
        if (vertice) {
          vertice.visible = this.seeCalibPoints && value;
        }
      }
    }
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
  recomputeVertex(blackList: Array<string> = []) {
    // Quitar todos los pickableObjects
    for (let i = 0; i < this.pickableObjects.length; i++) {
      const actual = this.pickableObjects[i];
      this.remove(actual);
    }

    for (let j = 0; j < this.registry.length; j++) {
      const object = this.registry[j];
      const isInBlackList = blackList.indexOf(object.name) >= 0;
      if (isInBlackList) {
        continue;
      }
      for (let i = 0; i < object.children.length; i++) {
        const child = object.children[i];
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          this.explodeMeshVertex(mesh, object.name, object.visible);
        }
      }
    }
  }

  useDefaultMaterial() {
    if (this.defaultMaterial == null) {
      return;
    }
    for (let j = 0; j < this.registry.length; j++) {
      const object = this.registry[j];
      this.setMaterial(object, this.defaultMaterial as any);
    }
  }

  addObjectLocal(object: THREE.Group) {
    this.registry.push(object);
    if (this.defaultMaterial != null) {
      this.setMaterial(object, this.defaultMaterial as any);
    }
    this.add(object);
  }

  setCalibPointsVisibility(visible: boolean) {
    // Debo iterar es:
    const llavesObjetos = Object.keys(this.vertexRegistry);
    for (let i = 0; i < llavesObjetos.length; i++) {
      const llaveObjeto = llavesObjetos[i];
      const objeto = this.getObjectByName(llaveObjeto);
      const resultado = visible && objeto?.visible !== false;
      const vertexMap = this.vertexRegistry[llaveObjeto];
      const vertexKeys = Object.keys(vertexMap);
      for (let j = 0; j < vertexKeys.length; j++) {
        const vertexKey = vertexKeys[j];
        const vertex = this.getObjectByName(vertexKey);
        if (vertex) {
          vertex.visible = resultado;
        }
      }
    }
  }

  setOrbitControls(enable: boolean) {
    if (enable) {
      if (this.orbitals || !this.camera || !this.renderer) {
        return;
      }
      this.camera.position.x = 10;
      this.camera.position.y = 10;
      this.camera.position.z = 10;

      this.camera.up = new THREE.Vector3(0, 1, 0);
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
      this.orbitals = new OrbitControls(this.camera, this.renderer.domElement);
    } else {
      if (this.orbitals) {
        this.orbitals.dispose();
        this.orbitals = null;
      }
    }
  }

  initialize(debug: boolean = true, addGridHelper: boolean = true) {
    this.camera = new THREE.PerspectiveCamera(
      35,
      this.bounds.width / this.bounds.height,
      0.1,
      500000
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef,
      alpha: true,
    });
    this.renderer.setSize(this.bounds.width, this.bounds.height);
    this.setOrbitControls(true);

    /*
    if (addGridHelper) {
      this.add(new THREE.GridHelper(10, 10, 'red'));
      this.add(new THREE.AxesHelper(3));
    }
    */

    //this.background = new THREE.Color(0x000000);

    /*
    for (let i = 0; i < this.lightCount; i++) {
      const light = new THREE.PointLight(0xffffff, 1);
      let lightX =
        this.lightDistance * Math.sin(((Math.PI * 2) / this.lightCount) * i);
      let lightZ =
        this.lightDistance * Math.cos(((Math.PI * 2) / this.lightCount) * i);
      light.position.set(lightX, this.lightDistance, lightZ);
      light.lookAt(0, 0, 0);
      this.add(light);
      this.lights.push(light);
      this.add(new THREE.PointLightHelper(light, 0.5, 0xff9900));
    }
    */

    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/img/chess.jpg');
    this.defaultMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      emissiveMap: texture,
      side: THREE.FrontSide,
      emissive: 0xffffff,
      emissiveIntensity: 1,
    });
    this.defaultMaterial.side = THREE.DoubleSide;
    //this.defaultMaterial.side = THREE.FrontSide;
    //this.defaultMaterial.side = THREE.BackSide;
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
}
