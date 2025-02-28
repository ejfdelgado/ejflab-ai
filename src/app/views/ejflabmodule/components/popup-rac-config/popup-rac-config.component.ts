import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalService } from 'ejflab-front-lib';
import { RacConfigData } from '../../services/knowledge.service';

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
export class PopupRacConfigComponent {
  formRight: FormGroup;
  data: RacConfigData;
  useRAC: boolean;
  showKnowledge: boolean;

  constructor(
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public dataIn: any,
    private dialogRef: MatDialogRef<PopupRacConfigComponent>,
    private modalSrv: ModalService,
  ) {
    const temp = dataIn.data as RacConfigData;
    this.data = {
      systemPrompt: temp.systemPrompt,
      queryPrompt: temp.queryPrompt,
      maxTokens: temp.maxTokens,
      maxDistance: temp.maxDistance,
      k: temp.k,
      useRAC: temp.useRAC,
      showKnowledge: temp.showKnowledge
    }
  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      systemPrompt: [this.data.systemPrompt, [Validators.required]],
      queryPrompt: [this.data.queryPrompt, [Validators.required]],
      maxTokens: [this.data.maxTokens, [Validators.required]],
      k: [this.data.k, [Validators.required]],
      maxDistance: [this.data.maxDistance, [Validators.required]],
    });
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
    // Rewrite all
    this.dialogRef.close(this.data);
  }

  changeUseRAC(event: any) {

  }

  changeShowKnowledge(event: any) {

  }
}
