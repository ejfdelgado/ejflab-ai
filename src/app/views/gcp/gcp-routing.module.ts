import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GcpComponent } from './gcp.component';

const routes: Routes = [{ path: '', component: GcpComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GcpRoutingModule { }
