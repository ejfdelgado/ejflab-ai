import * as THREE from 'three';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ThreejsProjectionComponent } from '../threejs-projection/threejs-projection.component';
import { HttpService } from 'ejflab-front-lib';

@Component({
  selector: 'app-threejs-camera',
  templateUrl: './threejs-camera.component.html',
  styleUrls: ['./threejs-camera.component.css'],
})
export class ThreejsCameraComponent implements OnInit {
  @ViewChild('three_ref') threeRef: ElementRef;
  @ViewChild('video') videoRef: ElementRef;
  @ViewChild('threejs_parent') threejsParent: ElementRef;
  @Input() parent: any;
  videoWidth: number | null = null;
  videoHeight: number | null = null;
  forcedWidth: number = 0;
  forcedLeft: number = 0;
  constructor(
    private readonly httpSrv: HttpService,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

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
    await this.refresh3dModels();
    setTimeout(() => {
      this.resizeComponents();
      this.cdr.detectChanges();
    }, 0);
  }

  getThreeComponent() {
    if (!this.threeRef) {
      return null;
    }
    const threejsComponent = this
      .threeRef as unknown as ThreejsProjectionComponent;
    if (!threejsComponent) {
      return null;
    }
    return threejsComponent;
  }

  removeAllMyObjects() {
    const threeComponent = this.getThreeComponent();
    if (!threeComponent) {
      return;
    }
    threeComponent.scene?.removeAllMyObjects();
  }

  async recomputeVertex() {
    const threeComponent = this.getThreeComponent();
    if (!threeComponent) {
      return;
    }
    threeComponent.scene?.recomputeVertex(['sand2']);
  }

  async add3DObject(uid: string, url: string | null, recomputeVertex: boolean) {
    const threeComponent = this.getThreeComponent();
    if (!threeComponent || url == null) {
      return;
    }
    const scene = threeComponent.scene;
    if (!scene) {
      return;
    }
    //check if it is already added
    const existente = scene.getObjectByName(uid);
    if (!existente) {
      // Load the url
      const object: any = await this.httpSrv.get(url, { isBlob: true });
      const nextUrl = URL.createObjectURL(object);
      await scene.loadObj(nextUrl, uid);
      URL.revokeObjectURL(nextUrl);
      if (recomputeVertex) {
        this.recomputeVertex();
      }
    }
  }

  async refresh3dModels(refresh = false) {
    // Itero los modelos y los cargo...
    if (refresh) {
      this.removeAllMyObjects();
    }
    const promesas: Array<any> = [];
    const sand = this.parent?.mymodel?.sand;
    if (sand) {
      if (sand.meshUrl) {
        promesas.push(this.add3DObject('sand', sand.meshUrl, false));
      }
      if (sand.meshUrl2) {
        promesas.push(this.add3DObject('sand2', sand.meshUrl2, false));
      }
    }
    await Promise.all(promesas);
    this.setObjectVisibility('sand', true);
    this.setObjectVisibility('sand2', false);
    this.recomputeVertex();
  }

  get3dPointsSand2(): Array<Array<number>> {
    // Obtener el objeto
    const objeto = this.getObjectByName('sand2');
    if (!objeto) {
      return [];
    }
    // Iterar los vertices
    const points3d = [];
    for (let i = 0; i < objeto.children.length; i++) {
      const child = objeto.children[i];
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const point = new THREE.Vector3();
        const positionAttribute: any = mesh.geometry.getAttribute('position');
        for (let i = 0; i < positionAttribute.count; i++) {
          point.fromBufferAttribute(positionAttribute, i);
          mesh.localToWorld(point);
          // Empacarlos en un arreglo de arreglos
          points3d.push([point.x, point.y, point.z]);
        }
      }
    }
    return points3d;
  }

  setObjectVisibility(name: string, value: boolean) {
    const threeComponent = this.getThreeComponent();
    if (!threeComponent) {
      return;
    }
    threeComponent.scene?.setObjectVisibility(name, value);
  }

  getObjectByName(name: string) {
    const threeComponent = this.getThreeComponent();
    if (!threeComponent) {
      return;
    }
    return threeComponent.scene?.getObjectByName(name);
  }

  resizeScene() {
    const threeComponent = this.getThreeComponent();
    if (!threeComponent) {
      return false;
    }
    threeComponent.onResize({ width: this.forcedWidth });
    return true;
  }

  resizeComponents() {
    const clientWidth = this.threejsParent.nativeElement.clientWidth;
    const clientHeight = this.threejsParent.nativeElement.clientHeight;
    if (this.videoWidth == null || this.videoHeight == null) {
      return;
    }
    const ratio = this.videoWidth / this.videoHeight;
    this.forcedWidth = Math.floor(ratio * clientHeight);
    this.forcedLeft = Math.floor((clientWidth - this.forcedWidth) / 2);
    this.resizeScene();
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event: any) {
    this.resizeComponents();
  }
}
