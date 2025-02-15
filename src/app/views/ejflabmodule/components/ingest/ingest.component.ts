import { Component, OnInit } from '@angular/core';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FlowchartProcessRequestData, FlowchartService, IndicatorService, JsonColorPipe, ModalService } from 'ejflab-front-lib';

export interface QADataType {
  id: number;
  distance: number;
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
  currentMatch: QADataType | null = null;

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
      database: ['test', [Validators.required]],
      collection: ['qa', [Validators.required]],
      documentId: ['default', [Validators.required]],
      text: ['', [Validators.required]],
    });
    this.formLeft = this.fb.group({
      query: ['', [Validators.required]],
    });
    this.formBottom = this.fb.group({
      text_indexed: ['', [Validators.required]],
      text_answer: ['', []],
    });
  }

  async indexQA() {
    const database = this.formRight.get('database');
    const collection = this.formRight.get('collection');
    const text = this.formRight.get('text');
    const documentId = this.formRight.get('documentId');
    if (!database || !collection || !text || !documentId) {
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
      processorMethod: 'milvusIx.indexqa',
      room: 'processors',
      namedInputs: {
        knowledge: chunks,
        database: database.value,
        collection: collection.value,
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
    const database = this.formRight.get('database');
    const collection = this.formRight.get('collection');
    if (!query || !database || !collection) {
      return;
    }
    // Call the processor
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'milvusIx.searchqa',
      room: 'processors',
      namedInputs: {
        query: query.value,
        database: database.value,
        collection: collection.value,
        kReRank: 5,
      },
      data: {

      },
    };
    const response = await this.flowchartSrv.process(payload, false);
    //const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    //this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
    const rerank = response?.response?.data?.rerank
    if (rerank) {
      this.formBottom.get('text_indexed')?.setValue(rerank.text_indexed);
      this.formBottom.get('text_answer')?.setValue(rerank.text_answer);
      this.currentMatch = rerank;
    } else {
      this.currentMatch = null;
    }
  }

  async deleteEntry() {
    if (!this.currentMatch) {
      return;
    }
    const confirm = await this.modalSrv.confirm({ title: "Delete", txt: "Can't be undone, sure?" });
    if (!confirm) {
      return;
    }
    const database = this.formRight.get('database');
    const collection = this.formRight.get('collection');
    if (!database || !collection) {
      return;
    }
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'milvusIx.deleteqa',
      room: 'processors',
      namedInputs: {
        item: {
          id: `${this.currentMatch.id}`,
        },
        database: database.value,
        collection: collection.value,
      },
      data: {

      },
    };
    const response = await this.flowchartSrv.process(payload, false);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }

  async updateEntry() {
    if (!this.currentMatch) {
      return;
    }
    const database = this.formRight.get('database');
    const collection = this.formRight.get('collection');
    if (!database || !collection) {
      return;
    }
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'milvusIx.updateqa',
      room: 'processors',
      namedInputs: {
        item: {
          id: `${this.currentMatch.id}`,
          text_answer: this.currentMatch.text_answer,
          text_indexed: this.currentMatch.text_indexed,
          document_id: this.currentMatch.document_id,
        },
        database: database.value,
        collection: collection.value,
      },
      data: {

      },
    };
    const response = await this.flowchartSrv.process(payload, false);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }
}
