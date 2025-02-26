import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { FlowchartProcessRequestData, IndicatorService, ModalService } from 'ejflab-front-lib';
import { EjflabBaseComponent } from '../../ejflabbase.component';

export interface ChatGPT4AllSessionData {
  role: string;
  content: string;
}

export interface AnswerData {
  txt: SafeHtml;
  detail: SafeHtml;
}

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

  constructor(
    public fb: FormBuilder,
    public modalSrv: ModalService,
    private indicatorSrv: IndicatorService,
  ) {
    super();
  }

  resetChat() {
    this.gpt4allSession = [];
    this.answers = [];
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      text: ['', [Validators.required]],
      systemPrompt: ['Eres un asistente en español', [Validators.required]],
      maxTokens: [1024, [Validators.required]],
    });
  }

  async chat() {
    if (!this.formRight.valid) {
      return;
    }
    const field = this.formRight.get('text');
    const systemPrompt = this.formRight.get('systemPrompt');
    const maxTokens = this.formRight.get('maxTokens');
    if (!field || !systemPrompt || !maxTokens) {
      return;
    }
    let text = field.value;
    if (text.trim().length == 0) {
      return;
    }
    const activity = this.indicatorSrv.start();
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'llm.chat',
      room: 'processors',
      namedInputs: {
        session: this.gpt4allSession,
        message: text,
      },
      data: {
        maxTokens: maxTokens.value,
        systemMessage: systemPrompt.value,
        chatTemplate: "### Human:\n{0}\n\n### Assistant:\n",
        streaming: true,
      },
    };
    this.tic();

    const gpt4allSession = this.gpt4allSession;
    const currentAnswer = {
      txt: text,
      detail: "",
    };
    this.answers.unshift(currentAnswer);
    field.setValue("");

    const urlServer = this.getRoot() + "srv/flowchart/processor_process_json";
    fetch(urlServer, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Set headers if necessary
      },
      body: JSON.stringify(payload), // Send data in the request body
    })
      .then((response: any) => {
        this.toc();
        activity.done();
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        function readChunk() {
          return reader.read().then((temporal: any) => {
            const { done, value } = temporal;
            if (done) {
              gpt4allSession.push({
                role: "user",
                content: text,
              });
              gpt4allSession.push({
                role: "assistant",
                content: currentAnswer.detail,
              });
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            currentAnswer.detail += chunk;
            return readChunk();
          });
        }
        return readChunk();
      })
      .catch(error => {
        this.modalSrv.error(error);
        activity.done();
      });
  }
}
