import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CvRoutingModule } from './cv-routing.module';
import { CvComponent } from './cv.component';
import { MycommonModule } from 'ejflab-front-lib';

@NgModule({
  declarations: [CvComponent],
  imports: [CommonModule, CvRoutingModule, MycommonModule],
})
export class CvModule { }
