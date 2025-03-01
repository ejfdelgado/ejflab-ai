import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { AnswerData, ChatGPT4AllSessionData, LLMEventData, LLMService } from '../../services/llm.service';
import { KnowledgeService, RacConfigData } from '../../services/knowledge.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent } from '../popup-rac-config/popup-rac-config.component';

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
  config: RacConfigData;

  constructor(
    private fb: FormBuilder,
    private LLMSrv: LLMService,
    private cdr: ChangeDetectorRef,
    private knowledgeSrv: KnowledgeService,
    private dialog: MatDialog,
  ) {
    super();
    this.config = this.knowledgeSrv.loadLocalConfig();
  }

  resetChat() {
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
    await this.LLMSrv.chat(text, this.gpt4allSession, this.config);
  }

  async configure() {
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
}
