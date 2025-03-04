import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImagiationComponent } from './imagiation.component';

const routes: Routes = [{ path: '', component: ImagiationComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ImagiationRoutingModule { }
