import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { FlowchartProcessRequestData, IndicatorService, ModalService } from 'ejflab-front-lib';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { KnowledgeService, QADataType } from '../../services/knowledge.service';
import { MyTemplate } from '@ejfdelgado/ejflab-common/src/MyTemplate';

export interface ChatGPT4AllSessionData {
  role: string;
  content: string;
}

export interface AnswerData {
  txt: SafeHtml;
  detail: SafeHtml;
  knowledge: QADataType[]
}

@Component({
  selector: 'app-llm-knowledge',
  templateUrl: './llm-knowledge.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../containers.css',
    '../../../../fonts.css',
    './llm-knowledge.component.css'
  ]
})
export class LlmKnowledgeComponent extends EjflabBaseComponent implements OnInit {
  formRight: FormGroup;
  gpt4allSession: Array<ChatGPT4AllSessionData> = [];
  answers: Array<AnswerData> = [];
  renderer = new MyTemplate();

  constructor(
    public fb: FormBuilder,
    public modalSrv: ModalService,
    private indicatorSrv: IndicatorService,
    public knowledgeSrv: KnowledgeService,
  ) {
    super();
  }

  resetChat() {
    this.gpt4allSession = [];
    this.answers = [];
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      text: ['', []],
      systemPrompt: ['Eres un asistente en español', [Validators.required]],
      queryPrompt: ['Responde la pregunta: "${text}" enfocandose en que: "${knowledge}"', [Validators.required]],
      maxTokens: [1024, [Validators.required]],
      k: [5, [Validators.required]],
      maxDistance: [0.6, [Validators.required]],
    });
  }

  async chat() {
    if (!this.formRight.valid) {
      return;
    }
    const field = this.formRight.get('text');
    const systemPrompt = this.formRight.get('systemPrompt');
    const queryPrompt = this.formRight.get('queryPrompt');
    const maxTokens = this.formRight.get('maxTokens');
    const k = this.formRight.get('k');
    const maxDistance = this.formRight.get('maxDistance');
    if (!field || !systemPrompt || !maxTokens || !k || !maxDistance || !queryPrompt) {
      return;
    }
    let text = field.value;
    if (text.trim().length == 0) {
      return;
    }
    const activity = this.indicatorSrv.start();

    // First fetch knowledge
    const knowledge = await this.knowledgeSrv.search(text, k.value, maxDistance.value);

    if (knowledge && knowledge.length > 0) {
      // Then build prompt
      const allKnowledge = knowledge.map((data) => {
        if (data.text_answer) {
          return data.text_answer;
        } else {
          return data.text_indexed
        }
      }).join('" y "');
      text = this.renderer.render(queryPrompt.value, {
        text: text,
        knowledge: allKnowledge,
      });
    }

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
    const currentAnswer: AnswerData = {
      txt: text,
      detail: "",
      knowledge: knowledge ? knowledge : [],
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
                content: currentAnswer.detail.toString(),
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
