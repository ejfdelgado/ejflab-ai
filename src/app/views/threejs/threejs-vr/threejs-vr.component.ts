import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { BasicScene } from './BasicScene';

export interface EntityValueHolder {
  getEntityValue(id: string, key: string): Promise<any>;
  setEntityValue(
    id: string,
    key: string,
    value: any,
    isMe: boolean
  ): Promise<void>;
}

export class LowPressure {
  lastTime: number = 0;
  delta: number;
  emmiter: EventEmitter<any>;
  constructor(delta: number, emmiter: EventEmitter<any>) {
    this.delta = delta;
    this.emmiter = emmiter;
  }
  emit(some: any) {
    const ahora = new Date().getTime();
    if (ahora - this.lastTime > this.delta) {
      this.lastTime = ahora;
      this.emmiter.emit(some);
    }
  }
}

@Component({
  selector: 'app-threejs-vr',
  templateUrl: './threejs-vr.component.html',
  styleUrls: ['./threejs-vr.component.css'],
})
export class ThreejsVrComponent
  implements OnInit, AfterViewInit, EntityValueHolder
{
  @ViewChild('mycanvas') canvasRef: ElementRef;
  @ViewChild('myparent') prentRef: ElementRef;
  scene: BasicScene | null = null;
  bounds: DOMRect | null = null;
  @Output()
  vrHeadset: EventEmitter<THREE.Vector3> = new EventEmitter();
  vrHeadsetLowPressure: LowPressure;

  constructor(private renderer: Renderer2) {
    this.vrHeadsetLowPressure = new LowPressure(150, this.vrHeadset);
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event: any) {
    this.computeDimensions();
    if (this.scene != null && this.bounds != null) {
      this.scene.setBounds(this.bounds);
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
    const vrButton = this.scene.vrButton;
    if (vrButton != null) {
      this.renderer.appendChild(this.prentRef.nativeElement, vrButton);
    }
    this.loop();
  }

  loop() {
    if (this.scene != null && this.scene.camera) {
      const scene: BasicScene = this.scene;
      const camera: THREE.PerspectiveCamera = this.scene.camera;
      // This is used for non VR
      /*
      this.scene.camera?.updateProjectionMatrix();
      this.scene.renderer?.render(this.scene, this.scene.camera);
      this.scene.orbitals?.update();
      requestAnimationFrame(() => {
        this.loop();
      });
      */

      // This is used for VR
      if (scene.renderer) {
        const renderer: THREE.WebGLRenderer = scene.renderer;
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
          const fullState: any = {};
          // Read position
          fullState.position = new THREE.Vector3();
          fullState.position.setFromMatrixPosition(camera.matrixWorld);
          // Read rotation
          fullState.rotation = new THREE.Quaternion();
          camera.getWorldQuaternion(fullState.rotation);
          // Read hands
          fullState.hand1 = this.getHandJoints('hand1', scene);
          fullState.hand2 = this.getHandJoints('hand2', scene);
          this.vrHeadsetLowPressure.emit(fullState);
        });
      }
    }
  }

  public getHandJoints(key: string, scene: any) {
    const points: any = [];
    if (scene[key]) {
      const children: any = scene[key].children;
      // From 1 to 25
      for (let i = 1; i <= 25; i++) {
        const child: THREE.Object3D = children[i];
        if (child) {
          const pos = new THREE.Vector3();
          child.getWorldPosition(pos);
          points.push(pos);
        }
      }
    }
    return points;
  }

  public computeDimensions() {
    const scrollEl = this.prentRef.nativeElement;
    this.bounds = scrollEl.getBoundingClientRect();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.onResize({});
    }, 0);
  }

  async getEntityValue(id: string, key: string): Promise<any> {
    if (this.scene) {
      return await this.scene.getEntityValue(id, key);
    } else {
      return null;
    }
  }

  async setEntityValue(id: string, key: string, value: any, isMe: boolean) {
    if (this.scene) {
      await this.scene.setEntityValue(id, key, value, isMe);
    }
  }

  async keyBoardEvent(
    id: string,
    keyAction: string,
    entityHolder: EntityValueHolder
  ) {
    const ROTATION_SPEED = 4;
    const POSITION_SPEED = 0.1;
    if (keyAction == 'ArrowUp') {
      //Go forward
      const rotation = await entityHolder.getEntityValue(id, 'rotation');
      const position = await entityHolder.getEntityValue(id, 'position');
      // compute vector front
      const dx = Math.cos(rotation._y);
      const dz = Math.sin(rotation._y);
      position.x = position.x - dx * POSITION_SPEED;
      position.z = position.z + dz * POSITION_SPEED;
      //this.vrPositionLowPressure.emit(position);
      await entityHolder.setEntityValue(id, 'position', position, true);
    } else if (keyAction == 'ArrowRight') {
      // Turn right
      const rotation = await entityHolder.getEntityValue(id, 'rotation');
      //console.log(`rotation = ${JSON.stringify(rotation)}`);
      const actualY = rotation._y;
      rotation.y = actualY - (ROTATION_SPEED * Math.PI) / 180;
      rotation._y = rotation.y;
      await entityHolder.setEntityValue(id, 'rotation', rotation, true);
    } else if (keyAction == 'ArrowLeft') {
      //Turn left
      const rotation = await entityHolder.getEntityValue(id, 'rotation');
      //console.log(`rotation = ${JSON.stringify(rotation)}`);
      const actualY = rotation._y;
      rotation.y = actualY + (ROTATION_SPEED * Math.PI) / 180;
      rotation._y = rotation.y;
      await entityHolder.setEntityValue(id, 'rotation', rotation, true);
    } else if (keyAction == 'ArrowDown') {
      //Go backwards
      const rotation = await entityHolder.getEntityValue(id, 'rotation');
      const position = await entityHolder.getEntityValue(id, 'position');
      // compute vector front
      const dx = Math.cos(rotation._y);
      const dz = Math.sin(rotation._y);
      position.x = position.x + dx * POSITION_SPEED;
      position.z = position.z - dz * POSITION_SPEED;
      //this.vrPositionLowPressure.emit(position);
      await entityHolder.setEntityValue(id, 'position', position, true);
    }
  }
}
