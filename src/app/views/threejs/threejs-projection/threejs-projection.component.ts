import * as THREE from 'three';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  GlobalModelData,
  TheStateViewData,
} from 'src/app/views/projection/projection.component';
import { BasicScene, DotModelData, KeyValueDotModelData } from './BasicScene';
import { IdGen } from '@ejfdelgado/ejflab-common/src/IdGen';
import { MyColor } from '@ejfdelgado/ejflab-common/src/MyColor';
import { HttpService } from 'ejflab-front-lib';

export interface CalibData {
  [key: string]: DotModelData;
}

const SUMSAMPLIG = 0.5;
const VOLUME = 2;
const REFRESH_INTERVAL = 500;
// 1. Remapeo de valores del video hacia un valor min y max...
// 2. Coloreado de cada vértice.

@Component({
  selector: 'app-threejs-projection',
  templateUrl: './threejs-projection.component.html',
  styleUrls: ['./threejs-projection.component.css'],
})
export class ThreejsProjectionComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @ViewChild('video') videoRef: ElementRef;
  @ViewChild('canvas_heat_map') canvasHeatMapRef: ElementRef;
  @ViewChild('videocanvas') videoCanvasRef: ElementRef;
  @ViewChild('mycanvas') canvasRef: ElementRef;
  @ViewChild('myparent') prentRef: ElementRef;
  sandRunning: boolean = false;
  sandReference: Array<Array<number>> = [];
  sandInterval: any = null;
  sandRemapping: Array<Array<number>> | null = null;
  sandUid: string | null = null;
  sandActual: THREE.Group | null = null;
  scene: BasicScene | null = null;
  bounds: DOMRect | null = null;
  DOT_OPTIONS: any = {
    border: 3,
    size: 8,
    style: null,
  };
  selectedDot: string | null = null;
  mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  videoWidth: number = 1;
  videoHeight: number = 1;
  @Output() selectedDotEvent = new EventEmitter<string | null>();
  @Output() modelChangedEvent = new EventEmitter<void>();
  @Input() DOTS_MODEL: CalibData | null;
  @Input() seeCalibPoints: boolean;
  @Input() mymodel: GlobalModelData;
  @Input() states: TheStateViewData;
  @Input() useSand: boolean;

  constructor(private readonly httpSrv: HttpService) {
    const style: any = {};
    style['border-width'] = this.DOT_OPTIONS.border + 'px';
    style['width'] = this.DOT_OPTIONS.size + 'px';
    style['height'] = this.DOT_OPTIONS.size + 'px';
    const tam = (
      (-1 * (this.DOT_OPTIONS.size + 2 * this.DOT_OPTIONS.border)) /
      2
    ).toFixed(0);
    style['left'] = tam + 'px';
    style['top'] = tam + 'px';
    this.DOT_OPTIONS.style = style;
  }

  ngOnChanges(changes: any) {
    if (!this.scene) {
      return;
    }
    if (changes.seeCalibPoints) {
      const actual = changes.seeCalibPoints.currentValue;
      this.scene.setCalibPointsVisibility(actual);
      this.scene.setSeeCalibPoints(actual);
    }
    if ('useSand' in changes) {
      this.toggleUseSand(changes.useSand.currentValue);
    }
  }

  createShaderMaterial() {
    const m = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
    });
    const c = this.canvasHeatMapRef.nativeElement;
    const ctx = c.getContext('2d');
    const gradient = ctx.createLinearGradient(0, c.height, 0, 0);
    gradient.addColorStop(0, '#0000FF');
    //gradient.addColorStop(0.5, '#fcd046');
    gradient.addColorStop(1, '#00FF00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, c.width, c.height);
    const colorTexture = new THREE.CanvasTexture(c);
    const uniforms = {
      colorTexture: { value: colorTexture },
      limits: { value: VOLUME },
    };

    //float h = (vPos.y - (-limits))/(limits * 2.);
    m.onBeforeCompile = (shader) => {
      shader.uniforms['colorTexture'] = uniforms.colorTexture;
      shader.uniforms['limits'] = uniforms.limits;
      shader.vertexShader = `
        varying vec3 vPos;
        ${shader.vertexShader}
      `.replace(
        `#include <fog_vertex>`,
        `#include <fog_vertex>
        vPos = vec3(position);
        `
      );
      shader.fragmentShader = `
        uniform float limits;
        uniform sampler2D colorTexture;
        
        varying vec3 vPos;
        ${shader.fragmentShader}
      `.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `
          float h = vPos.y/limits;
          h = clamp(h, 0., 1.);
          vec4 diffuseColor = texture2D(colorTexture, vec2(0, h));
        `
      );
    };
    return m;
  }

  async toggleUseSand(use: boolean) {
    const scene = this.scene;
    if (!scene) {
      return;
    }
    if (use) {
      // Se debe buscar:
      const sandData = this.mymodel.sand;
      // El obj
      const meshUrl2 = sandData.meshUrl2;
      // Load the url
      if (this.sandUid == null) {
        if (typeof meshUrl2 == 'string') {
          const object: any = await this.httpSrv.get(meshUrl2, {
            isBlob: true,
          });
          const nextUrl = URL.createObjectURL(object);
          this.sandUid = IdGen.num2ord(new Date().getTime());
          if (this.sandUid) {
            const promesa = scene.loadObj(
              nextUrl,
              this.sandUid,
              undefined,
              true
            );
            const objeto = await promesa;
            scene.setMaterial(objeto, this.createShaderMaterial());
            // Extraigo los vértices
            this.computeSand3dReferencePoints(objeto);
          }
          URL.revokeObjectURL(nextUrl);
        }
      } else {
        const objeto = scene.getObjectByName(this.sandUid);
        if (objeto) {
          objeto.visible = true;
        }
      }
      // El video
      const cameraId = sandData.cameraId;
      if (cameraId) {
        await this.useCamera(cameraId);
      }
      // El mapeo
      if (this.sandRemapping == null) {
        const map3d2dUrl = sandData.map3d2dUrl;
        if (typeof map3d2dUrl == 'string' && map3d2dUrl.length > 0) {
          this.sandRemapping = await this.httpSrv.get(map3d2dUrl, {
            isBlob: false,
          });
        }
      }
      // Interval para leer el video y capturar los pixeles
      const sandRefreshThis = this.sandRefresh.bind(this);
      this.sandInterval = setTimeout(sandRefreshThis, REFRESH_INTERVAL);
      this.sandRunning = true;
    } else {
      if (this.sandInterval != null) {
        clearTimeout(this.sandInterval);
      }
      // detener la captura
      // esconder el objeto
      if (this.sandUid) {
        const objeto = this.scene?.getObjectByName(this.sandUid);
        if (objeto) {
          objeto.visible = false;
        }
      }
      const videoEl = this.videoRef.nativeElement;
      if (videoEl) {
        videoEl.pause();
      }
      this.sandRunning = false;
    }
  }

  computeSand3dReferencePoints(object: THREE.Group) {
    this.sandActual = object;
    const sandReference: Array<Array<number>> = [];
    for (let i = 0; i < object.children.length; i++) {
      const child = object.children[i];
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const point = new THREE.Vector3();
        const positionAttribute: any = mesh.geometry.getAttribute('position');
        for (let i = 0; i < positionAttribute.count; i++) {
          point.fromBufferAttribute(positionAttribute, i);
          mesh.localToWorld(point);
          sandReference.push([point.x, point.y, point.z]);
        }
      }
    }
    this.sandReference = sandReference;
  }

  async sandRefresh() {
    if (!this.sandRunning) {
      return;
    }
    const scene = this.scene;
    if (!scene || !this.sandUid) {
      return;
    }
    // Itero todos los puntos y los desplazo
    // El objeto 3d original
    const sandReference = this.sandReference;
    // El objeto 3d a modificar
    const actual = this.sandActual;
    // La referencia del video
    const videoEl = this.videoRef.nativeElement;
    // La referencia del mapeo de pixeles
    const sandRemapping = this.sandRemapping;

    if (sandReference.length == 0 || !actual || !videoEl || !sandRemapping) {
      return;
    }

    // Se pasa el video al canvas
    const canvas = this.videoCanvasRef.nativeElement;
    canvas.width = Math.floor(this.videoWidth * SUMSAMPLIG);
    canvas.height = Math.floor(this.videoHeight * SUMSAMPLIG);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    // Itero todos los vértices
    let k = 0;
    for (let i = 0; i < actual.children.length; i++) {
      const child = actual.children[i];
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const positionAttribute: any = mesh.geometry.getAttribute('position');
        for (let j = 0; j < positionAttribute.count; j++) {
          const verticeReferencia = sandReference[k];
          const mappingReference = sandRemapping[k];
          const ux = Math.floor(mappingReference[0] * canvas.width);
          const uy = Math.floor(mappingReference[1] * canvas.height);

          const pixel = ctx.getImageData(ux, uy, 1, 1);
          const data = pixel.data;
          const r = data[0];
          const g = data[1];
          const b = data[2];

          const isUndefined = r > 250;

          if (isUndefined) {
          } else {
            let { h } = MyColor.rgb2hsv(r, g, b);
            h = h / 360;

            //const x = verticeReferencia[0];
            const y = verticeReferencia[1];
            //const z = verticeReferencia[2];
            const offset = h * VOLUME;
            // Get pixel point
            positionAttribute.setY(j, y + offset);
          }
          k++;
        }
        positionAttribute.needsUpdate = true;
      }
    }
    const sandRefreshThis = this.sandRefresh.bind(this);
    this.sandInterval = setTimeout(sandRefreshThis, REFRESH_INTERVAL);
  }

  async useCamera(deviceId: string) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId,
      },
    });
    const videoEl = this.videoRef.nativeElement;
    videoEl.srcObject = stream;
    const playResponse = videoEl.play();
    await playResponse;
    this.videoWidth = videoEl.videoWidth;
    this.videoHeight = videoEl.videoHeight;
  }

  select2DPoint(dotData: KeyValueDotModelData) {
    //console.log(`${key} ${JSON.stringify(dot)}`);
    if (!this.scene) {
      return;
    }
    const key = dotData.key;
    this.selectedDot = key;
    this.selectedDotEvent.emit(this.selectedDot);
    this.scene.selectKeyPoint(key);
  }

  get2DCoordinates(dotData: KeyValueDotModelData) {
    if (!this.scene || !dotData.value.v2) {
      return {};
    }
    const bounds = this.scene.bounds;
    const key = dotData.key;
    const dot = dotData.value;
    const style: any = {};
    if (dot.v2) {
      style['left'] = dot.v2.x * bounds.width + 'px';
      style['top'] = dot.v2.y * bounds.height + 'px';
    }
    return style;
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event: any) {
    this.computeDimensions();
    if (this.scene != null && this.bounds != null) {
      if (typeof event.width == 'number') {
        this.bounds.width = event.width;
      }
      this.scene.setBounds(this.bounds);
      if (this.scene.camera) {
        this.scene.setViewOffset(null);
      }
    }
  }

  @HostListener('click', ['$event'])
  onMouseClick(event: MouseEvent) {
    if (!this.scene || !this.DOTS_MODEL) {
      return;
    }
    const canvasEl = this.canvasRef.nativeElement;
    const bounds = canvasEl.getBoundingClientRect();
    this.scene.onMouseClick(event, bounds);
    if (event.ctrlKey) {
      // Validar si hay seleccionado
      if (this.selectedDot != null) {
        // Debo capturar la posición x y y
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        if (!(this.selectedDot in this.DOTS_MODEL)) {
          // En caso de que haya 3d seleccionado, se agrega
          const recuperado = this.scene.getSelectedVertex();
          if (recuperado) {
            this.DOTS_MODEL[this.selectedDot] = recuperado.value;
          }
        }
        this.DOTS_MODEL[this.selectedDot].v2 = { x, y };
        this.modelChangedEvent.emit();
      }
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(ev: MouseEvent) {
    if (!this.scene) {
      return;
    }
    const canvasEl = this.canvasRef.nativeElement;
    const bounds = canvasEl.getBoundingClientRect();
    this.scene.onMouseMove(ev, bounds);
    this.mousePosition.x = ev.clientX - bounds.left;
    this.mousePosition.y = ev.clientY - bounds.top;
  }

  removeSelectedPoint() {
    if (!this.selectedDot || !this.DOTS_MODEL) {
      return;
    }
    if (this.selectedDot in this.DOTS_MODEL) {
      delete this.DOTS_MODEL[this.selectedDot];
      this.modelChangedEvent.emit();
    }
  }

  listenSelected3DPoint(data: KeyValueDotModelData) {
    if (!this.DOTS_MODEL) {
      return;
    }
    if (data == null) {
      this.selectedDot = null;
      this.selectedDotEvent.emit(this.selectedDot);
    } else {
      this.selectedDot = data.key;
      this.selectedDotEvent.emit(this.selectedDot);
      if (!(data.key in this.DOTS_MODEL)) {
        this.DOTS_MODEL[data.key] = data.value;
        this.modelChangedEvent.emit();
      } else {
        this.DOTS_MODEL[data.key].v3 = data.value.v3;
      }
    }
  }

  ngAfterViewInit(): void {
    this.computeDimensions();
    if (this.bounds == null) {
      return;
    }
    const theCanvas = this.canvasRef.nativeElement;
    this.scene = new BasicScene(theCanvas, this.bounds);
    this.scene.initialize();
    const listenSelected3DPointThis = this.listenSelected3DPoint.bind(this);
    this.scene.dot3DSelected.subscribe(listenSelected3DPointThis);
    this.loop();
  }

  loop() {
    if (this.scene != null && this.scene.camera) {
      this.scene.camera?.updateProjectionMatrix();
      this.scene.update();
      this.scene.renderer?.render(this.scene, this.scene.camera);
      this.scene.orbitals?.update();
      requestAnimationFrame(() => {
        this.loop();
      });
    }
  }

  public computeDimensions() {
    const scrollEl = this.prentRef.nativeElement;
    this.bounds = scrollEl.getBoundingClientRect();
  }

  ngOnInit(): void {}

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    //console.log(event);
    if (event.ctrlKey && event.shiftKey) {
      switch (event.code) {
        case 'NumpadMultiply':
          this.removeSelectedPoint();
          break;
        default:
        //console.log(event.code);
      }
    }
  }
}
