import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { FlowchartProcessRequestData, IndicatorService, ModalService } from 'ejflab-front-lib';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { AnswerData, ChatGPT4AllSessionData, LLMEventData, LLMService } from '../../services/llm.service';
import { RacConfigData } from '../../services/knowledge.service';

@Component({
  selector: 'app-llm',
  templateUrl: './llm.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../containers.css',
    '../../../../fonts.css',
    './llm.component.css'
  ]
})
export class LlmComponent extends EjflabBaseComponent implements OnInit {
  formRight: FormGroup;
  gpt4allSession: Array<ChatGPT4AllSessionData> = [];
  answers: Array<AnswerData> = [];
  config: RacConfigData = {
    systemPrompt: 'Eres un asistente en español',
    queryPrompt: 'Responde la pregunta: "${text}" enfocandose en que: "${knowledge}"',
    maxTokens: 1024,
    k: 2,
    maxDistance: 0.6,
    useRAC: false,
    showKnowledge: false,
  };

  constructor(
    private fb: FormBuilder,
    private LLMSrv: LLMService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  resetChat() {
    this.gpt4allSession = [];
    this.answers = [];
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      text: ['', [Validators.required]],
      systemPrompt: ['Eres un asistente en español', [Validators.required]],
      maxTokens: [1024, [Validators.required]],
    });
    this.LLMSrv.LLMEvents.subscribe((event: LLMEventData) => {
      if (event.name == "chatSetup") {
        this.tic();
        this.answers.unshift(event.chat);
        const field = this.formRight.get('text');
        field?.setValue("");
      } else if (event.name == "chatStart") {
        this.toc();
      }
      this.cdr.detectChanges();
    });
  }

  async chat() {
    if (!this.formRight.valid) {
      return;
    }
    const field = this.formRight.get('text');
    const systemPrompt = this.formRight.get('systemPrompt');
    const maxTokens = this.formRight.get('maxTokens');
    if (!field || !systemPrompt || !maxTokens) {
      return;
    }
    let text = field.value;
    if (text.trim().length == 0) {
      return;
    }
    await this.LLMSrv.chat(text, this.gpt4allSession, this.config);
  }
}
