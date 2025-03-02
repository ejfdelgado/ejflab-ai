import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalService } from 'ejflab-front-lib';
import { RacConfigData } from '../../services/knowledge.service';
import { RACDatabaseService, SchemaDataType, TableDataType } from '../../services/racDatabase.service';
import { PopupDatabaseEditComponent } from '../popup-database-edit/popup-database-edit.component';
import { MyCookies } from '@ejfdelgado/ejflab-common/src/MyCookies';
import { Buffer } from 'buffer';

@Component({
  selector: 'app-popup-rac-config',
  templateUrl: './popup-rac-config.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../popup.css',
    '../../../../containers.css',
    '../../../../forms.css',
    './popup-rac-config.component.css'
  ]
})
export class PopupRacConfigComponent implements OnInit {
  formRight: FormGroup;
  data: RacConfigData;
  useRAC: boolean;
  showKnowledge: boolean;
  schemas: SchemaDataType[] = [];
  tables: TableDataType[] = [];

  constructor(
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public dataIn: any,
    private dialogRef: MatDialogRef<PopupRacConfigComponent>,
    private modalSrv: ModalService,
    private rACDatabaseSrv: RACDatabaseService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
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
    }
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      systemPrompt: [this.data.systemPrompt, [Validators.required]],
      queryPrompt: [this.data.queryPrompt, [Validators.required]],
      maxTokens: [this.data.maxTokens, [Validators.required]],
      k: [this.data.k, [Validators.required]],
      maxDistance: [this.data.maxDistance, [Validators.required]],
      schema: [this.data.schema, []],
      table: [this.data.table, []],
      language: [this.data.language, []],
    });

    if (this.data.schema) {
      this.refreshTables(this.data.schema);
    }

    this.formRight.get('schema')?.valueChanges.subscribe((next) => {
      if (next) {
        this.refreshTables(next);
      }
    });

    this.refreshSchemas();
  }

  async refreshSchemas() {
    this.schemas = await this.rACDatabaseSrv.getSchemas();
    this.cdr.detectChanges();
  }

  async refreshTables(schemaName: string) {
    this.tables = await this.rACDatabaseSrv.getTables(schemaName);
    this.cdr.detectChanges();
  }

  cancel() {
    this.dialogRef.close(null);
  }

  accept() {
    if (!this.formRight.valid) {
      this.modalSrv.alert({
        title: 'Ups!',
        txt: 'Verify the fields',
      });
      return;
    }
    this.data.systemPrompt = this.formRight.get('systemPrompt')?.getRawValue();
    this.data.queryPrompt = this.formRight.get('queryPrompt')?.getRawValue();
    this.data.maxTokens = this.formRight.get('maxTokens')?.getRawValue();
    this.data.maxDistance = this.formRight.get('maxDistance')?.getRawValue();
    this.data.k = this.formRight.get('k')?.getRawValue();
    this.data.schema = this.formRight.get('schema')?.getRawValue();
    this.data.table = this.formRight.get('table')?.getRawValue();
    this.data.language = this.formRight.get('language')?.getRawValue();
    // Rewrite all
    const base64 = Buffer.from(JSON.stringify(this.data), "utf8").toString('base64');
    MyCookies.setCookie("RAC_CONFIG", base64);
    this.dialogRef.close(this.data);
  }

  async manageDatabase() {
    const dialogRef = this.dialog.open(PopupDatabaseEditComponent, {
      data: {

      },
      //disableClose: true,
      panelClass: ['popup_1', 'nogalespopup'],
    });
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        this.refreshSchemas();
        const schema = this.formRight.get('schema')?.getRawValue();
        if (schema) {
          this.refreshTables(schema);
        }
      });
    }
  }
}
