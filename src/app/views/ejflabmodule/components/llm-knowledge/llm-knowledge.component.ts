import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalService } from 'ejflab-front-lib';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { MyTemplate } from '@ejfdelgado/ejflab-common/src/MyTemplate';
import { MatDialog } from '@angular/material/dialog';
import { Speech2TextEventData, Speech2TextService } from '../../services/speech2text.service';
import { Subscription } from 'rxjs';
import { AnswerData, ChatGPT4AllSessionData, LLMEventData, LLMService } from '../../services/llm.service';
import { Text2SpeechEventData, Text2SpeechService } from '../../services/text2speech.service';
import { ConfigRacService } from '../../services/configRac.service';

@Component({
  selector: 'app-llm-knowledge',
  templateUrl: './llm-knowledge.component.html',
  styleUrls: [
    './llm-knowledge.component.css'
  ]
})
export class LlmKnowledgeComponent extends EjflabBaseComponent implements OnInit, OnDestroy {
  formRight: FormGroup;
  gpt4allSession: Array<ChatGPT4AllSessionData> = [];
  answers: Array<AnswerData> = [];
  renderer = new MyTemplate();
  onSpeechStartSubscription: Subscription | null = null;
  llmEvents: Subscription | null = null;
  speechToTextEvents: Subscription | null = null;
  textIndex = 0;
  MIN_CHARACTERS = 50;
  text2speechArray: string[] = [];
  wasListening: boolean = false;
  @ViewChild('scrollableDiv') scrollableDiv!: ElementRef<HTMLDivElement>;

  constructor(
    private fb: FormBuilder,
    private modalSrv: ModalService,
    private cdr: ChangeDetectorRef,
    public speech2TextSrv: Speech2TextService,
    private text2speechSrv: Text2SpeechService,
    private LLMSrv: LLMService,
    public configSrv: ConfigRacService,
  ) {
    super();

  }

  scrollToBottom() {
    const div = this.scrollableDiv.nativeElement;
    div.scrollTop = div.scrollHeight; // Scroll to the bottom
  }

  async resetChat() {
    const confirm = await this.modalSrv.confirm({
      title: '¿Sure?',
      txt: "Can't be undone.",
    });
    if (!confirm) {
      return;
    }
    this.gpt4allSession = [];
    this.answers = [];
  }

  async checkPlay() {
    if (this.text2speechArray.length > 0) {
      // gets the first element
      const firstText = this.text2speechArray.splice(0, 1)[0];
      this.text2speechSrv.convert(firstText, this.configSrv.getConfig());
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
        this.scrollToBottom();
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
            if (!this.configSrv.getConfig().outputAudio) {
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
          if (this.configSrv.getConfig().outputAudio) {
            this.checkPlay();
          }
        }
        this.scrollToBottom();
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
        // Check if the speech was directed to the assistant
        const name = this.configSrv.getConfig().assistantName;
        const control = this.formRight.get('text');
        if (control) {
          const query: string = control.getRawValue();
          const index = this.sanitizeText(query).indexOf(this.sanitizeText(name));
          //console.log(`The name ${name} found at ${index} inside ${query}`);
          if (index >= 0 && index <= 10) {
            const truncated = query.substring(index + name.length).replace(/^\s*[,.;!]\s*/, "");
            control.setValue(truncated);
            this.chat();
          } else {
            if (this.wasListening) {
              this.speech2TextSrv.start();
            }
          }
        }
      }
      this.cdr.detectChanges();
    });
    await this.speech2TextSrv.turnOn();
  }

  sanitizeText(text: string) {
    text = text.toLocaleLowerCase().replace('á', "a");
    text = text.toLocaleLowerCase().replace('é', "e");
    text = text.toLocaleLowerCase().replace('í', "i");
    text = text.toLocaleLowerCase().replace('ó', "o");
    text = text.toLocaleLowerCase().replace('ú', "u");
    return text;
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
    await this.LLMSrv.chat(text, this.gpt4allSession, this.configSrv.getConfig());
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
