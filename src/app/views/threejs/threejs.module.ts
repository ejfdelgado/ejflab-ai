import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreejsComponent } from './threejs/threejs.component';
import { ThreejsGalleryComponent } from './threejs-gallery/threejs-gallery.component';
import { ThreejsVrComponent } from './threejs-vr/threejs-vr.component';
import { ThreejsProjectionComponent } from './threejs-projection/threejs-projection.component';
import { ThreejsCameraComponent } from './threejs-camera/threejs-camera.component';
import { ThreejsBodyComponent } from './threejs-body/threejs-body.component';

@NgModule({
  declarations: [
    ThreejsComponent,
    ThreejsGalleryComponent,
    ThreejsVrComponent,
    ThreejsProjectionComponent,
    ThreejsCameraComponent,
    ThreejsBodyComponent,
  ],
  imports: [CommonModule],
  exports: [
    ThreejsComponent,
    ThreejsGalleryComponent,
    ThreejsVrComponent,
    ThreejsProjectionComponent,
    ThreejsCameraComponent,
    ThreejsBodyComponent,
  ],
})
export class ThreejsModule { }
