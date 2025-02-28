import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Text2SpeechService } from '../../services/text2speech.service';

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

  constructor(
    public fb: FormBuilder,
    public text2SpeechSrv: Text2SpeechService
  ) {
    //
  }
  convert() {
    const text = this.formRight.get("text");
    if (!text) {
      return;
    }
    this.text2SpeechSrv.convert(text.getRawValue());
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      text: ['', [Validators.required]],
    });
  }
}
