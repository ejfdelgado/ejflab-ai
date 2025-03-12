import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { BasicScene, ItemModelRef } from './BasicScene';
import { LocalFileService } from 'ejflab-front-lib';

@Component({
  selector: 'app-threejs-gallery',
  templateUrl: './threejs-gallery.component.html',
  styleUrls: ['./threejs-gallery.component.css'],
})
export class ThreejsGalleryComponent implements OnInit, AfterViewInit {
  @ViewChild('mycanvas') canvasRef: ElementRef;
  @ViewChild('myparent') prentRef: ElementRef;
  scene: BasicScene | null = null;
  bounds: DOMRect | null = null;

  constructor(public cdr: ChangeDetectorRef) {}

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
      this.scene.ikSolver?.update();
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

  async addModel(
    item: ItemModelRef,
    localFileService: LocalFileService
  ): Promise<void> {
    if (this.scene != null) {
      await this.scene.addModel(item, localFileService);
    }
  }
}
