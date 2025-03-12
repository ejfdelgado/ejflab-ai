import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { BasicScene } from './BasicScene';

@Component({
  selector: 'app-threejs',
  templateUrl: './threejs.component.html',
  styleUrls: ['./threejs.component.css'],
})
export class ThreejsComponent implements OnInit, AfterViewInit {
  @ViewChild('mycanvas') canvasRef: ElementRef;
  @ViewChild('myparent') prentRef: ElementRef;
  scene: BasicScene | null = null;
  bounds: DOMRect | null = null;

  constructor() {}

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
    this.loop();
  }

  loop() {
    if (this.scene != null && this.scene.camera) {
      this.scene.camera?.updateProjectionMatrix();
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

  ngOnInit(): void {
    setTimeout(() => {
      this.onResize({});
    }, 0);
  }
}
