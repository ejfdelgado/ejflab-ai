import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { FlowchartProcessRequestData, IndicatorService, ModalService } from 'ejflab-front-lib';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { QADataType } from '../../services/knowledge.service';
import { MyTemplate } from '@ejfdelgado/ejflab-common/src/MyTemplate';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent, RacConfigData } from '../popup-rac-config/popup-rac-config.component';
import { Speech2TextEventData, Speech2TextService } from '../../services/speech2text.service';
import { Subscription } from 'rxjs';
import { AnswerData, ChatGPT4AllSessionData, LLMEventData, LLMService } from '../../services/llm.service';

@Component({
  selector: 'app-llm-knowledge',
  templateUrl: './llm-knowledge.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../containers.css',
    '../../../../fonts.css',
    '../../../../forms.css',
    './llm-knowledge.component.css'
  ]
})
export class LlmKnowledgeComponent extends EjflabBaseComponent implements OnInit, OnDestroy {
  formRight: FormGroup;
  gpt4allSession: Array<ChatGPT4AllSessionData> = [];
  answers: Array<AnswerData> = [];
  renderer = new MyTemplate();
  viewKnowledge: boolean = false;
  config: RacConfigData = {
    systemPrompt: 'Eres un asistente en español',
    queryPrompt: 'Responde la pregunta: "${text}" enfocandose en que: "${knowledge}"',
    maxTokens: 1024,
    k: 2,
    maxDistance: 0.6,
  };
  onSpeechStartSubscription: Subscription | null = null;
  onSpeechEnd: Subscription | null = null;
  speechToTextEvents: Subscription | null = null;

  constructor(
    public fb: FormBuilder,
    public modalSrv: ModalService,
    private indicatorSrv: IndicatorService,
    public dialog: MatDialog,
    public cdr: ChangeDetectorRef,
    public speech2TextSrv: Speech2TextService,
    private LLMSrv: LLMService,
  ) {
    super();
  }

  resetChat() {
    this.gpt4allSession = [];
    this.answers = [];
  }

  async ngOnInit() {
    this.formRight = this.fb.group({
      text: ['', []],
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
    this.speech2TextSrv.speechToTextEvents.subscribe((event: Speech2TextEventData) => {
      if (event.name == "transcriptEnds" && event.audio) {
        const message = event.audio.transcript.transcription;
        const field = this.formRight.get('text');
        field?.setValue(message);
        this.chat();
      }
      this.cdr.detectChanges();
    });
    await this.speech2TextSrv.turnOn();
  }

  async ngOnDestroy() {
    await this.speech2TextSrv.turnOff();
    if (this.onSpeechStartSubscription) {
      this.onSpeechStartSubscription.unsubscribe();
    }
    if (this.onSpeechEnd) {
      this.onSpeechEnd.unsubscribe();
    }
    if (this.speechToTextEvents) {
      this.speechToTextEvents.unsubscribe();
    }
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
    await this.LLMSrv.chat(text, this.gpt4allSession, maxTokens.value, systemPrompt.value, this.config);
  }

  async openConfiguration() {
    const dialogRef = this.dialog.open(PopupRacConfigComponent, {
      data: {
        data: this.config
      },
      //disableClose: true,
      panelClass: ['popup_1', 'nogalespopup'],
    });
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.config = result;
        }
      });
    }
  }

  changeVideoKnowledge(event: any) {
    this.cdr.detectChanges();
  }
}
