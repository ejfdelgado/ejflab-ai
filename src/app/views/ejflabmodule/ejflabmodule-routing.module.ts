import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EjflabmoduleComponent } from './ejflabmodule.component';

const routes: Routes = [{ path: '', component: EjflabmoduleComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EjflabmoduleRoutingModule { }
