import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { KnowledgeService, QADataType, RacConfigData } from '../../services/knowledge.service';
import { JsonColorPipe, ModalService } from 'ejflab-front-lib';

@Component({
  selector: 'app-knowledge-list',
  templateUrl: './knowledge-list.component.html',
  styleUrls: [
    './knowledge-list.component.css'
  ]
})
export class KnowledgeListComponent implements OnInit, OnChanges {
  formBottom: FormGroup;
  @Input() currentMatches: QADataType[];
  @Input() config: RacConfigData;
  @Output() currentMatchesChange: EventEmitter<QADataType[]> = new EventEmitter();
  @Output() deleteEntry: EventEmitter<QADataType> = new EventEmitter();
  @Output() updateEntry: EventEmitter<QADataType> = new EventEmitter();

  constructor(
    public fb: FormBuilder,
    public modalSrv: ModalService,
    public knowledgeSrv: KnowledgeService,
    public jsonColorPipe: JsonColorPipe,
  ) {
    this.formBottom = new FormGroup({
      formArrayName: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentMatches']) {
      this.buildForm();
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

  async updateEntryFun(currentMatch: QADataType) {
    const response = await this.knowledgeSrv.update(currentMatch, this.config);
    this.updateEntry.emit(currentMatch);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }

  async deleteEntryFun(currentMatch: QADataType) {
    const confirm = await this.modalSrv.confirm({ title: "Delete", txt: "Can't be undone, sure?" });
    if (!confirm) {
      return;
    }
    const deleted = await this.knowledgeSrv.delete(currentMatch, this.config);
    if (deleted) {
      const index = this.currentMatches.indexOf(currentMatch);
      this.currentMatches.splice(index, 1);
      this.deleteEntry.emit(currentMatch);
      this.buildForm();
    } else {
      this.modalSrv.alert({ title: "Ups!", txt: "Entry was not deleted." });
    }
  }
}
