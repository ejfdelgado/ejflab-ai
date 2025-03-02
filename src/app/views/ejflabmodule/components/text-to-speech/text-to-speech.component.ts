import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Text2SpeechService } from '../../services/text2speech.service';
import { KnowledgeService, RacConfigData } from '../../services/knowledge.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent } from '../popup-rac-config/popup-rac-config.component';

@Component({
  selector: 'app-text-to-speech',
  templateUrl: './text-to-speech.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../containers.css',
    '../../../../fonts.css',
    './text-to-speech.component.css'
  ],
})
export class TextToSpeechComponent implements OnInit {
  formRight: FormGroup;
  config: RacConfigData;

  constructor(
    public fb: FormBuilder,
    public text2SpeechSrv: Text2SpeechService,
    private knowledgeSrv: KnowledgeService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {
    this.config = this.knowledgeSrv.loadLocalConfig();
  }

  convert() {
    const text = this.formRight.get("text");
    if (!text) {
      return;
    }
    const value = text.getRawValue().trim();
    if (value.length == 0) {
      return;
    }
    this.text2SpeechSrv.convert(value, this.config);
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      text: ['', []],
    });
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

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.convert();
    }
  }
}
