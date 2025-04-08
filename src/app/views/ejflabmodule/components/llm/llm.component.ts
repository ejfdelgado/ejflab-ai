import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { AnswerData, ChatGPT4AllSessionData, LLMEventData, LLMService } from '../../services/llm.service';
import { KnowledgeService, RacConfigData } from '../../services/knowledge.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent } from '../popup-rac-config/popup-rac-config.component';
import { ConfigRacService } from '../../services/configRac.service';
import { ModalService } from 'ejflab-front-lib';

@Component({
  selector: 'app-llm',
  templateUrl: './llm.component.html',
  styleUrls: [
    './llm.component.css'
  ]
})
export class LlmComponent extends EjflabBaseComponent implements OnInit {
  formRight: FormGroup;
  gpt4allSession: Array<ChatGPT4AllSessionData> = [];
  answers: Array<AnswerData> = [];

  constructor(
    private fb: FormBuilder,
    private LLMSrv: LLMService,
    private cdr: ChangeDetectorRef,
    private modalSrv: ModalService,
    public configSrv: ConfigRacService,
  ) {
    super();
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

  ngOnInit(): void {
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
  }

  async chat() {
    if (!this.formRight.valid) {
      return;
    }
    const field = this.formRight.get('text');
    if (!field) {
      return;
    }
    let text: string = field.getRawValue();
    if (text.trim().length == 0) {
      return;
    }
    await this.LLMSrv.chat(text, this.gpt4allSession, this.configSrv.getConfig());
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.chat();
    }
  }
}
