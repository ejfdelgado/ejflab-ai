import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreejsComponent } from './threejs/threejs.component';
import { ThreejsGalleryComponent } from './threejs-gallery/threejs-gallery.component';
import { ThreejsVrComponent } from './threejs-vr/threejs-vr.component';

@NgModule({
  declarations: [
    ThreejsComponent,
    ThreejsGalleryComponent,
    ThreejsVrComponent,
  ],
  imports: [CommonModule],
  exports: [
    ThreejsComponent,
    ThreejsGalleryComponent,
    ThreejsVrComponent,
  ],
})
export class ThreejsModule {}
