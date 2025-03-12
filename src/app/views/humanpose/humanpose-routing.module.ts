import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HumanposeComponent } from './humanpose.component';

const routes: Routes = [{ path: '', component: HumanposeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HumanposeRoutingModule { }
