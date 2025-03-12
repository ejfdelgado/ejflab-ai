import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectionRoutingModule } from './projection-routing.module';
import { ProjectionComponent } from './projection.component';
import { MenuControlComponent } from './components/menu-control/menu-control.component';
import { VideoCanvasComponent } from './components/video-canvas/video-canvas.component';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { LicenseComponent } from './components/license/license.component';
import { MycommonModule } from 'ejflab-front-lib';
import { ThreejsModule } from '../threejs/threejs.module';

@NgModule({
  declarations: [
    ProjectionComponent,
    MenuControlComponent,
    VideoCanvasComponent,
    LicenseComponent,
  ],
  imports: [
    MatIconModule,
    CommonModule,
    MycommonModule,
    ProjectionRoutingModule,
    FormsModule,
    ThreejsModule,
  ],
})
export class ProjectionModule {}
