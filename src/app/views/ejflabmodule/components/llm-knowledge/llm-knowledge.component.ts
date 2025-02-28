import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { FlowchartProcessRequestData, IndicatorService, ModalService } from 'ejflab-front-lib';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { KnowledgeService, QADataType } from '../../services/knowledge.service';
import { MyTemplate } from '@ejfdelgado/ejflab-common/src/MyTemplate';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent, RacConfigData } from '../popup-rac-config/popup-rac-config.component';
import { AudioData, Speech2TextEventData, Speech2TextService } from '../../services/speech2text.service';
import { Subscription } from 'rxjs';

export interface ChatGPT4AllSessionData {
  role: string;
  content: string;
}

export interface AnswerData {
  txt: SafeHtml;
  detail: SafeHtml;
  knowledge: QADataType[]
}

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
    public knowledgeSrv: KnowledgeService,
    public dialog: MatDialog,
    public cdr: ChangeDetectorRef,
    public speech2TextSrv: Speech2TextService,
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
    await this.speech2TextSrv.turnOn();
    this.speech2TextSrv.speechToTextEvents.subscribe((event: Speech2TextEventData) => {
      if (event.name == "transcriptEnds" && event.audio) {
        const message = event.audio.transcript.transcription;
        const field = this.formRight.get('text');
        field?.setValue(message);
        this.chat();
      }
      this.cdr.detectChanges();
    });
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
    if (!field) {
      return;
    }
    let text = field.value;
    if (text.trim().length == 0) {
      return;
    }
    const activity = this.indicatorSrv.start();

    // First fetch knowledge
    const knowledge = await this.knowledgeSrv.search(text, this.config.k, this.config.maxDistance);

    let modifiedText = text;
    if (knowledge && knowledge.length > 0) {
      // Then build prompt
      const allKnowledge = knowledge.map((data) => {
        if (data.text_answer) {
          return data.text_answer;
        } else {
          return data.text_indexed
        }
      }).join('" y "');
      modifiedText = this.renderer.render(this.config.queryPrompt, {
        text: text,
        knowledge: allKnowledge,
      });
    }

    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'llm.chat',
      room: 'processors',
      namedInputs: {
        session: this.gpt4allSession,
        message: modifiedText,
      },
      data: {
        maxTokens: this.config.maxTokens,
        systemMessage: this.config.systemPrompt,
        chatTemplate: "### Human:\n{0}\n\n### Assistant:\n",
        streaming: true,
      },
    };
    this.tic();

    const gpt4allSession = this.gpt4allSession;
    const currentAnswer: AnswerData = {
      txt: text,
      detail: "",
      knowledge: knowledge ? knowledge : [],
    };
    this.answers.unshift(currentAnswer);
    field.setValue("");

    const urlServer = this.getRoot() + "srv/flowchart/processor_process_json";
    fetch(urlServer, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Set headers if necessary
      },
      body: JSON.stringify(payload), // Send data in the request body
    })
      .then((response: any) => {
        this.toc();
        activity.done();
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const readChunk = () => {
          return reader.read().then((temporal: any) => {
            const { done, value } = temporal;
            if (done) {
              gpt4allSession.push({
                role: "user",
                content: text,
              });
              gpt4allSession.push({
                role: "assistant",
                content: currentAnswer.detail.toString(),
              });
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            currentAnswer.detail += chunk;
            this.cdr.detectChanges();
            return readChunk();
          });
        }
        return readChunk();
      })
      .catch(error => {
        this.modalSrv.error(error);
        activity.done();
      });
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
