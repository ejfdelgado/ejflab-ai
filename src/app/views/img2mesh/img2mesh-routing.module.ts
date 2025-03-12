import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Img2meshComponent } from './img2mesh.component';

const routes: Routes = [{ path: '', component: Img2meshComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Img2meshRoutingModule { }
