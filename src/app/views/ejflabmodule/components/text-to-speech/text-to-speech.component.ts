import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  ) {
    //
  }
  convert() {

  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      text: ['', [Validators.required]],
    });
  }
}
