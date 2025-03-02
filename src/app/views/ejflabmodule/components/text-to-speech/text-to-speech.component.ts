import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Text2SpeechEventData, Text2SpeechService } from '../../services/text2speech.service';
import { KnowledgeService, RacConfigData } from '../../services/knowledge.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent } from '../popup-rac-config/popup-rac-config.component';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { ConfigRacService } from '../../services/configRac.service';

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
export class TextToSpeechComponent extends EjflabBaseComponent implements OnInit {
  formRight: FormGroup;
  isProcessing: boolean = false;

  constructor(
    public fb: FormBuilder,
    public text2SpeechSrv: Text2SpeechService,
    public configSrv: ConfigRacService,
  ) {
    super();
  }

  convert() {
    if (this.isProcessing) {
      return;
    }
    const text = this.formRight.get("text");
    if (!text) {
      return;
    }
    const value = text.getRawValue().trim();
    if (value.length == 0) {
      return;
    }
    this.isProcessing = true;
    this.text2SpeechSrv.convert(value, this.configSrv.getConfig());
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      text: ['', []],
    });
    this.text2SpeechSrv.audioEvents.subscribe((event: Text2SpeechEventData) => {
      if (event.name == "endsAll") {
        this.isProcessing = false;
      } else if (event.name == "funStart") {
        this.tic();
      } else if (event.name == "funEnds") {
        this.toc();
      }
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.convert();
    }
  }
}
