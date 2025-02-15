import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EjflabmoduleRoutingModule } from './ejflabmodule-routing.module';
import { EjflabmoduleComponent } from './ejflabmodule.component';


@NgModule({
  declarations: [
    EjflabmoduleComponent
  ],
  imports: [
    CommonModule,
    EjflabmoduleRoutingModule
  ]
})
export class EjflabmoduleModule { }
