import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JsonColorPipe, ModalService, PagingData } from 'ejflab-front-lib';
import { KnowledgeService, QADataType, RacConfigData } from '../../services/knowledge.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupRacConfigComponent } from '../popup-rac-config/popup-rac-config.component';
import { ConfigRacService } from '../../services/configRac.service';

@Component({
  selector: 'app-ingest',
  templateUrl: './ingest.component.html',
  styleUrls: [
    './ingest.component.css'
  ]
})
export class IngestComponent extends EjflabBaseComponent implements OnInit {
  formRight: FormGroup;
  formLeft: FormGroup;
  currentMatches: QADataType[] = [];
  lastAction: string = "";
  indexProgress: number = 0;
  paging: PagingData = {
    limit: 10,
    offset: 0,
    direction: "DESC",
    orderColumn: "created"
  };

  constructor(
    public fb: FormBuilder,
    public modalSrv: ModalService,
    public knowledgeSrv: KnowledgeService,
    public jsonColorPipe: JsonColorPipe,
    private cdr: ChangeDetectorRef,
    public configSrv: ConfigRacService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      documentId: ['default', [Validators.required]],
      chunkSize: [100, [Validators.required]],
      text: ['', []],
    });
    this.formLeft = this.fb.group({
      query: ['', []],
    });
  }

  async indexQA() {
    this.indexProgress = 0;
    const text = this.formRight.get('text');
    const documentId = this.formRight.get('documentId');
    if (!text || !documentId) {
      return;
    }
    const emitter = this.knowledgeSrv.index(text.value, documentId.value, this.configSrv.getConfig());
    if (emitter) {
      emitter.subscribe((event) => {
        this.indexProgress = Math.ceil(100*event.processed / event.total);
        this.cdr.detectChanges();
      });
      this.lastAction = "index";
      //const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
      //this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
    }
  }

  async search() {
    const query = this.formLeft.get('query');
    if (!query) {
      return;
    }
    const rerank = await this.knowledgeSrv.search(query.value, this.configSrv.getConfig());
    if (rerank) {
      this.currentMatches = rerank;
    } else {
      this.resetMatches();
    }
    this.lastAction = "search";
  }

  resetMatches() {
    this.currentMatches = [];
    this.paging.offset = 0;
  }

  async page() {
    if (this.lastAction !== "page") {
      this.resetMatches();
    }
    this.paging.offset = this.currentMatches.length;
    const parts = await this.knowledgeSrv.page(this.paging, this.configSrv.getConfig());
    if (parts.length > 0) {
      const temp = [];
      temp.push(...this.currentMatches);
      temp.push(...parts);
      this.currentMatches = temp;
      this.lastAction = "page";
    }
  }

  async splitText() {
    const text = this.formRight.get('text');
    const chunkSize = this.formRight.get('chunkSize');
    const documentId = this.formRight.get('documentId');

    if (!text || !documentId || !chunkSize) {
      return;
    }
    const response = await this.knowledgeSrv.chunk(text.value, chunkSize.value);
    const chunkList = response?.response?.data?.chunks;
    if (chunkList) {
      //const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
      //this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
      const replacementText = chunkList
        .map((line: string) => { return line.replace(/[\n\r]/g, " ") })
        .join('\n\n');
      text.setValue(replacementText);
    }
  }
}
