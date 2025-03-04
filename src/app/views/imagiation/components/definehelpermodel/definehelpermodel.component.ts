import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModalService } from 'ejflab-front-lib';

@Component({
  selector: 'app-definehelpermodel',
  templateUrl: './definehelpermodel.component.html',
  styleUrls: ['./definehelpermodel.component.css'],
})
export class DefinehelpermodelComponent implements OnInit {
  form: FormGroup;
  modelId: string | null | undefined;
  constructor(
    private dialogRef: MatDialogRef<DefinehelpermodelComponent>,
    private fb: FormBuilder,
    private modalSrv: ModalService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.modelId = data.modelId;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      modelId: [this.modelId, []],
    });
    const llaves = ['modelId'];
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      this.form.controls[llave].valueChanges.subscribe((value) => {
        this.changedValues(llave, value);
      });
    }
  }

  changedValues(key: string, val: any) {
    //console.log(`key = ${key} val = ${val} ${typeof val}`);
    if (key == 'modelId') {
      this.modelId = val;
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  apply() {
    if (this.form.valid) {
      this.dialogRef.close({ modelId: this.modelId });
    } else {
      this.modalSrv.alert({
        title: 'Ups...',
        txt: 'Verifica tus datos antes de continuar.',
      });
    }
  }
}
