import { Component, OnInit } from '@angular/core';
import { EjflabBaseComponent } from '../../ejflabbase.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IndicatorService, JsonColorPipe, ModalService, PagingData } from 'ejflab-front-lib';
import { KnowledgeService, QADataType } from '../../services/knowledge.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupDatabaseEditComponent } from '../popup-database-edit/popup-database-edit.component';

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
  currentMatches: QADataType[] = [];
  lastAction: string = "";
  paging: PagingData = {
    limit: 10,
    offset: 0,
    direction: "DESC",
    orderColumn: "created"
  };

  constructor(
    public fb: FormBuilder,
    public modalSrv: ModalService,
    private indicatorSrv: IndicatorService,
    public knowledgeSrv: KnowledgeService,
    public jsonColorPipe: JsonColorPipe,
    private dialog: MatDialog,
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
      k: [5, [Validators.required]],
      maxDistance: [0.6, [Validators.required]],
    });
  }

  async indexQA() {
    const text = this.formRight.get('text');
    const documentId = this.formRight.get('documentId');
    if (!text || !documentId) {
      return;
    }
    const response = await this.knowledgeSrv.index(text.value, documentId.value);
    this.lastAction = "index";
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
    const rerank = await this.knowledgeSrv.search(query.value, k.value, maxDistance.value);
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
    const parts = await this.knowledgeSrv.page(this.paging);
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

  async configureDatabase() {
    const dialogRef = this.dialog.open(PopupDatabaseEditComponent, {
      data: {

      },
      //disableClose: true,
      panelClass: ['popup_1', 'nogalespopup'],
    });
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        //
      });
    }
  }
}
