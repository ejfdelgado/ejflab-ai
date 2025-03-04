import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImagiationDataQuery } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { toCanvas } from 'qrcode';
import { MyDatesFront } from '@ejfdelgado/ejflab-common/src/MyDatesFront';

@Component({
  selector: 'app-filterimage',
  templateUrl: './filterimage.component.html',
  styleUrls: ['./filterimage.component.css'],
})
export class FilterimageComponent implements OnInit {
  currentUrl: string = '';
  form: FormGroup;
  filter: ImagiationDataQuery;
  pageId: string;
  pageType: string;
  constructor(
    private dialogRef: MatDialogRef<FilterimageComponent>,
    private fb: FormBuilder,
    private modalSrv: ModalService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.filter = JSON.parse(JSON.stringify(data.filter));
    this.pageId = data.pageId;
    this.pageType = data.pageType;
  }

  ngOnInit(): void {
    const ahora = new Date().getTime();
    this.form = this.fb.group({
      min_offset: [this.filter.min_offset, [Validators.required]],
      max: [this.filter.max, [Validators.required]],
      max_count: [this.filter.max_count, [Validators.required]],
      min_date: [
        this.filter.min_date == 0 ? null : new Date(this.filter.min_date),
        [],
      ],
      max_date: [
        this.filter.max_date == 0 ? null : new Date(this.filter.max_date),
        [],
      ],
    });
    const llaves = ['min_offset', 'max', 'max_count', 'min_date', 'max_date'];
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      this.form.controls[llave].valueChanges.subscribe((value) => {
        this.changedValues(llave, value);
      });
    }
    setTimeout(() => {
      this.generateUrl();
    }, 0);
  }

  generateUrl(changed?: { key: string; val: any }) {
    const queryParams: any = {
      mode: 'tag',
    };
    if (this.form.value.min_offset != null) {
      queryParams['min_offset'] = this.form.value.min_offset;
    }
    if (this.form.value.max != null) {
      queryParams['max'] = this.form.value.max;
    }
    if (this.form.value.max_count != null) {
      queryParams['max_count'] = this.form.value.max_count;
    }
    if (this.form.value.min_date != null) {
      queryParams['min_date'] = MyDatesFront.getDayAsContinuosNumberHmmSS(
        this.form.value.min_date
      );
    }
    if (this.form.value.max_date != null) {
      queryParams['max_date'] = MyDatesFront.getDayAsContinuosNumberHmmSS(
        this.form.value.max_date
      );
    }
    if (changed) {
      if (changed.val instanceof Date) {
        queryParams[changed.key] = MyDatesFront.getDayAsContinuosNumberHmmSS(
          changed.val
        );
      } else {
        queryParams[changed.key] = changed.val;
      }
      if (changed.val === null) {
        delete queryParams[changed.key];
      }
    }

    const params = new URLSearchParams(queryParams);
    let canvas = document.getElementById('qrcanvas');
    this.currentUrl = `${location.origin}/${this.pageType}/${
      this.pageId
    }?${params.toString()}`;
    toCanvas(canvas, this.currentUrl, {
      width: 256,
    });
  }

  changedValues(key: string, val: any) {
    //console.log(`key = ${key} val = ${val} ${typeof val}`);
    const changed = {
      key: key,
      val: val,
    };
    this.generateUrl(changed);
  }

  cancelar() {
    this.dialogRef.close();
  }

  apply() {
    if (this.form.valid) {
      this.filter.min_offset = this.form.value.min_offset;
      this.filter.max = this.form.value.max;
      this.filter.max_count = this.form.value.max_count;
      if (this.form.value.min_date != null) {
        this.filter.min_date = this.form.value.min_date.getTime();
      } else {
        this.filter.min_date = 0;
      }
      if (this.form.value.max_date != null) {
        this.filter.max_date = this.form.value.max_date.getTime();
      } else {
        this.filter.max_date = 0;
      }
      this.dialogRef.close(this.filter);
    } else {
      this.modalSrv.alert({
        title: 'Ups...',
        txt: 'Verifica tus datos antes de continuar.',
      });
    }
  }
}
