import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EjflabmoduleRoutingModule } from './ejflabmodule-routing.module';
import { EjflabmoduleComponent } from './ejflabmodule.component';
import { MatIconModule } from '@angular/material/icon';
import { MycommonModule } from 'ejflab-front-lib';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { LlmComponent } from './components/llm/llm.component';
import { MilvusComponent } from './components/milvus/milvus.component';
import { IngestComponent } from './components/ingest/ingest.component';
import { LlmKnowledgeComponent } from './components/llm-knowledge/llm-knowledge.component';
import { KnowledgeListComponent } from './components/knowledge-list/knowledge-list.component';


@NgModule({
  declarations: [
    EjflabmoduleComponent,
    LlmComponent,
    MilvusComponent,
    IngestComponent,
    LlmKnowledgeComponent,
    KnowledgeListComponent
  ],
  imports: [
    CommonModule,
    EjflabmoduleRoutingModule,
    MatIconModule,
    MycommonModule,
    FormsModule,
    MatMenuModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatTabsModule,
  ]
})
export class EjflabmoduleModule { }
