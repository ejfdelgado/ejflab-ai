import { Component, OnInit } from '@angular/core';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FlowchartProcessRequestData, FlowchartService, IndicatorService, JsonColorPipe, ModalService } from 'ejflab-front-lib';

export interface QADataType {
  id: number;
  distance: number;
  score_reranked: number;
  document_id: string;
  text_answer: string;
  text_indexed: string;
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
    public flowchartSrv: FlowchartService,
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

    // Split text into... ==, then with => if it exists
    const chunksTokens = text.value.split(/[\n\r]/g);
    const chunks = chunksTokens
      .map((line: string) => { return line.trim(); })
      .filter((line: string) => {
        // Remove any empty line
        return line.length > 0;
      })
      .map((line: string) => {
        // Check if should be Query Answer or only Knowledge
        const tokens = line.split(/=>/g);
        const response: any = {
          document_id: documentId.value,
          text_answer: '',
        };
        response.text_indexed = tokens[0];
        if (tokens.length > 1) {
          response.text_answer = tokens[1];
        }
        return response;
      });
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'baai.index',
      room: 'processors',
      namedInputs: {
        knowledge: chunks,
      },
      data: {

      },
    };
    const response = await this.flowchartSrv.process(payload, false);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }

  async search() {
    const query = this.formLeft.get('query');
    if (!query) {
      return;
    }
    // Call the processor
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'baai.search',
      room: 'processors',
      namedInputs: {
        query: query.value,
        kReRank: 5,
      },
      data: {

      },
    };
    const response = await this.flowchartSrv.process(payload, false);
    /*
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
    */

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
        console.log(`${index} = ${JSON.stringify(value)}`);
        //this.currentMatches[index] = value;
      });
      i++;
    });
  }

  async deleteEntry(currentMatch: QADataType) {
    const confirm = await this.modalSrv.confirm({ title: "Delete", txt: "Can't be undone, sure?" });
    if (!confirm) {
      return;
    }
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'milvusIx.deleteqa',
      room: 'processors',
      namedInputs: {
        item: {
          id: `${currentMatch.id}`,
        },
      },
      data: {

      },
    };
    const response = await this.flowchartSrv.process(payload, false);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }

  async updateEntry(currentMatch: QADataType) {
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'milvusIx.updateqa',
      room: 'processors',
      namedInputs: {
        item: {
          id: `${currentMatch.id}`,
          text_answer: currentMatch.text_answer,
          text_indexed: currentMatch.text_indexed,
          document_id: currentMatch.document_id,
        },
      },
      data: {

      },
    };
    const response = await this.flowchartSrv.process(payload, false);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }
}
