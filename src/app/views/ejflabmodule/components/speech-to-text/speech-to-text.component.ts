import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FlowchartProcessRequestData, FlowchartService, HttpService, JsonColorPipe, ModalService } from 'ejflab-front-lib';
import { AudioData, Speech2TextService } from '../../services/speech2text.service';

@Component({
  selector: 'app-speech-to-text',
  templateUrl: './speech-to-text.component.html',
  styleUrl: './speech-to-text.component.css'
})
export class SpeechToTextComponent implements OnInit, OnDestroy {
  audios: Array<AudioData> = [];
  formLeft: FormGroup;

  constructor(
    public cdr: ChangeDetectorRef,
    public flowchartSrv: FlowchartService,
    public modalSrv: ModalService,
    public fb: FormBuilder,
    public httpSrv: HttpService,
    public jsonColorPipe: JsonColorPipe,
    public speech2TextSrv: Speech2TextService,
  ) {
  }

  async ngOnInit() {
    this.formLeft = this.fb.group({
      display: ['', []],
      displayFileUpload: ['', []],
    });
    await this.speech2TextSrv.turnOn();
    this.speech2TextSrv.onSpeechStart.subscribe((audio: AudioData) => {
      this.cdr.detectChanges();
    });
    this.speech2TextSrv.onSpeechEnd.subscribe((audio: AudioData) => {
      this.audios.push(audio);
    });
    this.speech2TextSrv.speechToTextEvents.subscribe((audio: AudioData) => {
      this.cdr.detectChanges();
    });
  }

  async ngOnDestroy() {
    await this.speech2TextSrv.turnOff();
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

  async start() {
    this.speech2TextSrv.start();
  }

  async pause() {
    this.speech2TextSrv.pause();
  }
}
