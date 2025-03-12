import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HumanposeRoutingModule } from './humanpose-routing.module';
import { HumanposeComponent } from './humanpose.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MycommonModule } from 'ejflab-front-lib';
import { ThreejsModule } from '../threejs/threejs.module';
import { TensorflowModule } from '../tensorflow/tensorflow.module';


@NgModule({
  declarations: [HumanposeComponent],
  imports: [
    MatIconModule,
    CommonModule,
    MycommonModule,
    FormsModule,
    HumanposeRoutingModule,
    MatInputModule,
    ThreejsModule,
    TensorflowModule,
  ],
  exports: [
    HumanposeComponent
  ]
})
export class HumanposeModule {}
