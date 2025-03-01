import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalService } from 'ejflab-front-lib';
import { RACDatabaseService, SchemaDataType, TableDataType } from '../../services/racDatabase.service';

@Component({
  selector: 'app-popup-database-edit',
  templateUrl: './popup-database-edit.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../popup.css',
    '../../../../containers.css',
    '../../../../forms.css',
    './popup-database-edit.component.css'
  ]
})
export class PopupDatabaseEditComponent implements OnInit {
  form: FormGroup;
  schemas: SchemaDataType[] = [];
  tables: TableDataType[] = [];

  constructor(
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public dataIn: any,
    private dialogRef: MatDialogRef<PopupDatabaseEditComponent>,
    private modalSrv: ModalService,
    private rACDatabaseSrv: RACDatabaseService,
  ) {
    //
  }

  async ngOnInit(): Promise<void> {
    this.form = this.fb.group({
      systemPrompt: ["", [Validators.required]],
      queryPrompt: ["", [Validators.required]],
    });
    this.schemas = await this.rACDatabaseSrv.getSchemas();
  }

  cancel() {
    this.dialogRef.close();
  }
}
