import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TensorflowtrainComponent } from './tensorflowtrain/tensorflowtrain.component';
import { TensorflowComponent } from './tensorflow/tensorflow.component';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [TensorflowtrainComponent, TensorflowComponent],
  imports: [CommonModule, FormsModule, MatIconModule],
  exports: [TensorflowtrainComponent, TensorflowComponent],
})
export class TensorflowModule {}
