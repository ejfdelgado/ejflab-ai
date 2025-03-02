import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalService } from 'ejflab-front-lib';
import { RACDatabaseService, SchemaDataType, TableDataType } from '../../services/racDatabase.service';
import { RacConfigData } from '../../services/knowledge.service';

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
  tablesSelect: TableDataType[] = [];
  schemaName: string = "";
  tableName: string = "";
  data: RacConfigData;

  constructor(
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public dataIn: any,
    private dialogRef: MatDialogRef<PopupDatabaseEditComponent>,
    private modalSrv: ModalService,
    private rACDatabaseSrv: RACDatabaseService,
    private cdr: ChangeDetectorRef,
  ) {
    const temp = dataIn.data as RacConfigData;
    this.data = {
      systemPrompt: temp.systemPrompt,
      queryPrompt: temp.queryPrompt,
      maxTokens: temp.maxTokens,
      maxDistance: temp.maxDistance,
      k: temp.k,
      useRAC: temp.useRAC,
      showKnowledge: temp.showKnowledge,
      outputAudio: temp.outputAudio,
      schema: temp.schema,
      table: temp.table,
      language: temp.language,
      assistantName: temp.assistantName
    }
  }

  async ngOnInit(): Promise<void> {
    this.form = this.fb.group({
      schemaName: ["", []],
      tableName: ["", []],
      schema: [this.data.schema, []],
      table: [this.data.table, []],
    });

    this.form.get('schemaName')?.valueChanges.subscribe((next) => {
      this.schemaName = next;
    });
    this.form.get('tableName')?.valueChanges.subscribe((next) => {
      this.tableName = next;
    });
    if (this.data.schema) {
      this.refreshTablesSelect();
    }
    this.form.get('schema')?.valueChanges.subscribe((next) => {
      this.refreshTablesSelect();
    });
    this.refreshSchemas();
  }

  isSchemaPresent() {
    const filtered = this.schemas.filter((schema) => { return schema.name == this.schemaName });
    return filtered.length > 0;
  }

  isTablePresent() {
    const filtered = this.tables.filter((table) => { return table.name == this.tableName });
    return filtered.length > 0;
  }

  isNameValid(name: string) {
    if (!/^[a-z_]+$/.exec(name.trim())) {
      this.modalSrv.alert({ title: "Opps!", txt: "Names only can contain a-z and _ characters" });
      return false;
    }
    return true;
  }

  async refreshSchemas() {
    this.schemas = await this.rACDatabaseSrv.getSchemas();
    this.cdr.detectChanges();
  }

  async refreshTablesSelect() {
    const name = this.form.get('schema')?.getRawValue().trim();
    if (name) {
      this.tablesSelect = await this.rACDatabaseSrv.getTables(name);
      this.cdr.detectChanges();
    }
  }

  async refreshTables() {
    const name = this.form.get('schemaName')?.getRawValue().trim();
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
    const name = this.form.get('schemaName')?.getRawValue().trim();
    if (name) {
      const confirm = await this.modalSrv.confirm({ title: `Destroy "${name}" schema?`, txt: "Can't be undone" });
      if (confirm) {
        await this.rACDatabaseSrv.destroySchema(name);
        this.tables = [];
        this.refreshSchemas();
        this.refreshTablesSelect();
      }
    }
  }

  async createTable() {
    const schemaName = this.form.get('schemaName')?.getRawValue().trim();
    const tableName = this.form.get('tableName')?.getRawValue().trim();
    if (this.isNameValid(schemaName) && this.isNameValid(tableName)) {
      await this.rACDatabaseSrv.createTable(schemaName, tableName);
      this.refreshTables();
      this.refreshTablesSelect();
    }
  }

  async destroyTable() {
    const schemaName = this.form.get('schemaName')?.getRawValue().trim();
    const tableName = this.form.get('tableName')?.getRawValue().trim();
    if (this.isNameValid(schemaName) && this.isNameValid(tableName)) {
      const confirm = await this.modalSrv.confirm({ title: `Destroy "${schemaName}.${tableName}" table?`, txt: "Can't be undone" });
      if (confirm) {
        await this.rACDatabaseSrv.destroyTable(schemaName, tableName);
        this.refreshTables();
        this.refreshTablesSelect();
      }
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  accept() {
    this.dialogRef.close();
  }
}
