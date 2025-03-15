import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BodyRoutingModule } from './body-routing.module';
import { BodyComponent } from './body.component';
import { MycommonModule } from 'ejflab-front-lib';
import { ThreejsModule } from '../threejs/threejs.module';


@NgModule({
  declarations: [
    BodyComponent
  ],
  imports: [
    CommonModule,
    BodyRoutingModule,
    MycommonModule,
    ThreejsModule
  ]
})
export class BodyModule { }
