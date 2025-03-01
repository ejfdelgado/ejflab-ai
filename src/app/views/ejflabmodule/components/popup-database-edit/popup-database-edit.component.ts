import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
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
    private cdr: ChangeDetectorRef,
  ) {
    //
  }

  async ngOnInit(): Promise<void> {
    this.form = this.fb.group({
      schemaName: ["", []],
      tableName: ["", []],
    });
    this.refreshSchemas();
  }

  isNameValid(name: string) {
    if (!/[a-z]+/.exec(name.trim())) {
      this.modalSrv.alert({ title: "Opps!", txt: "Names only can contain a-z characters" });
      return false;
    }
    return true;
  }

  async refreshSchemas() {
    this.schemas = await this.rACDatabaseSrv.getSchemas();
    this.cdr.detectChanges();
  }

  async refreshTables() {
    const name = this.form.get('schemaName')?.getRawValue();
    if (!name) {
      return;
    }
    this.tables = await this.rACDatabaseSrv.getTables(name);
    this.cdr.detectChanges();
  }

  async selectSchema(schema: SchemaDataType) {
    this.form.get('schemaName')?.setValue(schema.name);
    this.form.get('tableName')?.setValue('');
    // Reload table names
    this.refreshTables();
  }

  async selectTable(table: TableDataType) {
    this.form.get('tableName')?.setValue(table.name);
    this.cdr.detectChanges();
  }

  async createSchema() {
    const name = this.form.get('schemaName')?.getRawValue().trim();
    if (this.isNameValid(name)) {
      await this.rACDatabaseSrv.createSchema(name);
      this.refreshSchemas();
    }
  }

  async destroySchema() {
    const name = this.form.get('schemaName')?.getRawValue();
    if (name) {
      const confirm = await this.modalSrv.confirm({ title: `Destroy ${name} schema?`, txt: "Can't be undone" });
      if (confirm) {
        await this.rACDatabaseSrv.destroySchema(name);
        this.refreshSchemas();
      }
    }
  }

  async createTable() {
    const schemaName = this.form.get('schemaName')?.getRawValue().trim();
    const tableName = this.form.get('tableName')?.getRawValue().trim();
    if (this.isNameValid(schemaName) && this.isNameValid(tableName)) {
      await this.rACDatabaseSrv.createTable(schemaName, tableName);
      this.refreshTables();
    }
  }

  async destroyTable() {
    const schemaName = this.form.get('schemaName')?.getRawValue().trim();
    const tableName = this.form.get('tableName')?.getRawValue().trim();
    if (this.isNameValid(schemaName) && this.isNameValid(tableName)) {
      await this.rACDatabaseSrv.destroyTable(schemaName, tableName);
      this.refreshTables();
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
