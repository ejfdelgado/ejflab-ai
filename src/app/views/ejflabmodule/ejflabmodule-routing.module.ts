import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EjflabmoduleComponent } from './ejflabmodule.component';
import { LlmComponent } from './components/llm/llm.component';
import { MilvusComponent } from './components/milvus/milvus.component';

const routes: Routes = [
  {
    path: '',
    component: EjflabmoduleComponent,
    children: [
      {
        path: 'llm',
        component: LlmComponent,
      },
      {
        path: 'milvus',
        component: MilvusComponent,
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EjflabmoduleRoutingModule { }
