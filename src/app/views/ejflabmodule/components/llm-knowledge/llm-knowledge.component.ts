import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IndicatorService, ModalService } from 'ejflab-front-lib';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { MyTemplate } from '@ejfdelgado/ejflab-common/src/MyTemplate';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent } from '../popup-rac-config/popup-rac-config.component';
import { Speech2TextEventData, Speech2TextService } from '../../services/speech2text.service';
import { Subscription } from 'rxjs';
import { AnswerData, ChatGPT4AllSessionData, LLMEventData, LLMService } from '../../services/llm.service';
import { RacConfigData } from '../../services/knowledge.service';
import { Text2SpeechEventData, Text2SpeechService } from '../../services/text2speech.service';

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
  config: RacConfigData = {
    systemPrompt: 'Eres un asistente que solo habla español',
    queryPrompt: 'Responde la pregunta: "${text}" enfocandose en que: "${knowledge}"',
    maxTokens: 1024,
    k: 2,
    maxDistance: 0.6,
    useRAC: false,
    showKnowledge: false,
    outputAudio: false,
  };
  onSpeechStartSubscription: Subscription | null = null;
  llmEvents: Subscription | null = null;
  speechToTextEvents: Subscription | null = null;
  textIndex = 0;
  MIN_CHARACTERS = 50;
  text2speechArray: string[] = [];
  wasListening: boolean = false;

  constructor(
    private fb: FormBuilder,
    private modalSrv: ModalService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public speech2TextSrv: Speech2TextService,
    private text2speechSrv: Text2SpeechService,
    private LLMSrv: LLMService,
  ) {
    super();
  }

  resetChat() {
    this.gpt4allSession = [];
    this.answers = [];
  }

  async checkPlay() {
    if (this.text2speechArray.length > 0) {
      // gets the first element
      const firstText = this.text2speechArray.splice(0, 1)[0];
      this.text2speechSrv.convert(firstText);
    }
  }

  async ngOnInit() {
    this.formRight = this.fb.group({
      text: ['', []],
    });
    this.text2speechSrv.audioEvents.subscribe((event: Text2SpeechEventData) => {
      if (event.name == "ends") {
        this.checkPlay();
      } else if (event.name == "endsAll") {
        this.speech2TextSrv.start();
        this.cdr.detectChanges();
      } else if (event.name == "starts") {
        this.speech2TextSrv.pause();
        this.cdr.detectChanges();
      }
    });
    this.llmEvents = this.LLMSrv.LLMEvents.subscribe((event: LLMEventData) => {
      if (event.name == "chatSetup") {
        this.tic();
        this.answers.push(event.chat);
        const field = this.formRight.get('text');
        field?.setValue("");
      } else if (event.name == "chatStart") {
        this.toc();
        this.textIndex = 0;
        this.text2speechArray = [];
      }

      if (event.name == "chatChunk" || event.name == "chatEnds") {
        const answer = event.chat.answer;
        // takes the substring
        const sub = answer.substring(this.textIndex);
        const complete_words = /^.*\s/.exec(sub);
        if ((complete_words && complete_words[0].length > this.MIN_CHARACTERS) || event.name == "chatEnds") {
          if (event.name == "chatEnds") {
            this.text2speechArray.push(sub);
            if (!this.config.outputAudio) {
              if (this.wasListening) {
                this.speech2TextSrv.start();
              }
            }
          } else {
            if (complete_words) {
              this.text2speechArray.push(complete_words[0]);
              this.textIndex += complete_words[0].length;
            }
          }
          if (this.config.outputAudio) {
            this.checkPlay();
          }
        }
      }
      // scroll down
      this.cdr.detectChanges();
    });
    this.speechToTextEvents = this.speech2TextSrv.speechToTextEvents.subscribe((event: Speech2TextEventData) => {
      if (event.name == "transcriptEnds" && event.audio) {
        const message = event.audio.transcript.transcription;
        const field = this.formRight.get('text');
        field?.setValue(message);
        if (this.speech2TextSrv.isListening()) {
          this.wasListening = true;
          this.speech2TextSrv.pause();
        } else {
          this.wasListening = false;
        }
        this.cdr.detectChanges();
        this.chat();
      }
      this.cdr.detectChanges();
    });
    await this.speech2TextSrv.turnOn();
  }

  async ngOnDestroy() {
    await this.speech2TextSrv.turnOff();
    if (this.llmEvents) {
      this.llmEvents.unsubscribe();
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
    await this.LLMSrv.chat(text, this.gpt4allSession, this.config);
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
          this.cdr.detectChanges();
        }
      });
    }
  }

  changeVideoKnowledge(event: any) {
    this.cdr.detectChanges();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.chat();
    }
  }
}
