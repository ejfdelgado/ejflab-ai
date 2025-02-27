import { Component, OnInit } from '@angular/core';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IndicatorService, JsonColorPipe, ModalService } from 'ejflab-front-lib';
import { KnowledgeService } from '../../services/knowledge.service';

export interface QADataType {
  id: number;
  distance: number;
  score_reranked: number;
  document_id: string;
  text_answer: string;
  text_indexed: string;
  created?: number;
  updated?: number;
}

@Component({
  selector: 'app-ingest',
  templateUrl: './ingest.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../containers.css',
    '../../../../fonts.css',
    './ingest.component.css'
  ]
})
export class IngestComponent extends EjflabBaseComponent implements OnInit {
  formRight: FormGroup;
  formLeft: FormGroup;
  formBottom: FormGroup;
  currentMatches: QADataType[] = [];

  constructor(
    public fb: FormBuilder,
    public modalSrv: ModalService,
    private indicatorSrv: IndicatorService,
    public knowledgeSrv: KnowledgeService,
    public jsonColorPipe: JsonColorPipe,
  ) {
    super();
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      documentId: ['default', [Validators.required]],
      text: ['', [Validators.required]],
    });
    this.formLeft = this.fb.group({
      query: ['', [Validators.required]],
      k: [5, [Validators.required]],
      maxDistance: [0.6, [Validators.required]],
    });
    this.formBottom = new FormGroup({
      formArrayName: this.fb.array([]),
    });
    this.buildForm();
  }

  async indexQA() {
    const text = this.formRight.get('text');
    const documentId = this.formRight.get('documentId');
    if (!text || !documentId) {
      return;
    }
    const response = await this.knowledgeSrv.index(text.value, documentId.value);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }

  async search() {
    const query = this.formLeft.get('query');
    const k = this.formLeft.get('k');
    const maxDistance = this.formLeft.get('maxDistance');
    if (!query || !k || !maxDistance) {
      return;
    }
    const response = await this.knowledgeSrv.search(query.value, k.value, maxDistance.value);
    const rerank = response?.response?.data?.rows
    if (rerank) {
      this.currentMatches = rerank;
      this.buildForm();
    } else {
      this.currentMatches = [];
    }
  }

  buildForm() {
    const controlArray = this.formBottom.get('formArrayName') as FormArray;
    controlArray.clear();

    let i = 0;
    this.currentMatches.forEach((mytag) => {
      const control = this.fb.group({
        text_indexed: new FormControl({
          value: mytag.text_indexed,
          disabled: false,
        }),
        text_answer: new FormControl({
          value: mytag.text_answer,
          disabled: false,
        }),
      });
      controlArray.push(control);
      let index = i;
      control.valueChanges.subscribe((value: any) => {
        const { text_indexed, text_answer } = value;
        this.currentMatches[index].text_indexed = text_indexed;
        this.currentMatches[index].text_answer = text_answer;
      });
      i++;
    });
  }

  async deleteEntry(currentMatch: QADataType) {
    const confirm = await this.modalSrv.confirm({ title: "Delete", txt: "Can't be undone, sure?" });
    if (!confirm) {
      return;
    }
    const deleted = await this.knowledgeSrv.delete(currentMatch);
    if (deleted) {
      const index = this.currentMatches.indexOf(currentMatch);
      this.currentMatches.splice(index, 1);
      this.buildForm();
    } else {
      this.modalSrv.alert({ title: "Ups!", txt: "Entry was not deleted." });
    }
  }

  async updateEntry(currentMatch: QADataType) {
    const response = await this.knowledgeSrv.update(currentMatch);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }
}
