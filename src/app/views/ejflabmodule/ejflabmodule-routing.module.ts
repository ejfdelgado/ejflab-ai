import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EjflabmoduleComponent } from './ejflabmodule.component';
import { LlmComponent } from './components/llm/llm.component';
import { MilvusComponent } from './components/milvus/milvus.component';
import { IngestComponent } from './components/ingest/ingest.component';
import { LlmKnowledgeComponent } from './components/llm-knowledge/llm-knowledge.component';
import { SpeechToTextComponent } from './components/speech-to-text/speech-to-text.component';
import { TextToSpeechComponent } from './components/text-to-speech/text-to-speech.component';
import { OcrComponent } from './components/ocr/ocr.component';

const routes: Routes = [
  {
    path: '',
    component: EjflabmoduleComponent,
    children: [
      { path: 'llm', component: LlmComponent, },
      { path: 'llm_knowledge', component: LlmKnowledgeComponent, },
      { path: 'speech_to_text', component: SpeechToTextComponent, },
      { path: 'text_to_speech', component: TextToSpeechComponent, },
      { path: 'milvus', component: MilvusComponent, },
      { path: 'ingest', component: IngestComponent, },
      { path: 'ocr', component: OcrComponent, },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EjflabmoduleRoutingModule { }
