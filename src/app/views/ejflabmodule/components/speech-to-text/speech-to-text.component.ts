import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FlowchartService, HttpService, JsonColorPipe, ModalService } from 'ejflab-front-lib';
import { AudioData, Speech2TextEventData, Speech2TextService } from '../../services/speech2text.service';
import { Subscription } from 'rxjs';
import { KnowledgeService, RacConfigData } from '../../services/knowledge.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent } from '../popup-rac-config/popup-rac-config.component';
import { ConfigRacService } from '../../services/configRac.service';

@Component({
  selector: 'app-speech-to-text',
  templateUrl: './speech-to-text.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../containers.css',
    '../../../../fonts.css',
    './speech-to-text.component.css'
  ]
})
export class SpeechToTextComponent implements OnInit, OnDestroy {
  audios: Array<AudioData> = [];
  formLeft: FormGroup;
  onSpeechStartSubscription: Subscription | null = null;
  onSpeechEnd: Subscription | null = null;
  speechToTextEvents: Subscription | null = null;

  constructor(
    public cdr: ChangeDetectorRef,
    public flowchartSrv: FlowchartService,
    public modalSrv: ModalService,
    public fb: FormBuilder,
    public httpSrv: HttpService,
    public jsonColorPipe: JsonColorPipe,
    public speech2TextSrv: Speech2TextService,
    public configSrv: ConfigRacService,
  ) {

  }

  async ngOnInit() {
    this.formLeft = this.fb.group({
      display: ['', []],
      displayFileUpload: ['', []],
    });
    await this.speech2TextSrv.turnOn();
    this.speech2TextSrv.speechToTextEvents.subscribe((event: Speech2TextEventData) => {
      if (event.name == "transcriptStarts" && event.audio) {
        this.audios.unshift(event.audio);
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

  audioIdentity(index: number, item: AudioData) {
    return item.id;
  }

  async removeAudio(audio: AudioData) {
    const confirm = await this.modalSrv.confirm({
      title: '¿Sure?',
      txt: "Can't be undone.",
    });
    if (!confirm) {
      return;
    }
    const index = this.audios.indexOf(audio);
    if (index >= 0) {
      this.audios.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  showAudioDetail(audio: AudioData) {
    const html = "<pre>" + this.jsonColorPipe.transform(audio) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }
}
