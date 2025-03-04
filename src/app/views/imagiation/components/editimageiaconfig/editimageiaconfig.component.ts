import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { toCanvas } from 'qrcode';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModalService } from 'ejflab-front-lib';

import {
  ImageiationService,
  TheTagData,
  PlayDetectionData,
} from 'ejflab-front-lib';
import { FileService } from 'ejflab-front-lib';
import { MailService } from 'ejflab-front-lib';
import { InterpretDetections } from './processors/InterpretDetections';

// http://localhost:4200/imagiation?mode=play

@Component({
  selector: 'app-editimageiaconfig',
  templateUrl: './editimageiaconfig.component.html',
  styleUrls: ['./editimageiaconfig.component.css'],
})
export class EditimageiaconfigComponent implements OnInit {
  @ViewChild('canvas_ref') canvasRef: ElementRef;
  form: FormGroup;
  model: PlayDetectionData;
  modeTypes = [
    { id: 'environment', txt: 'Frontal' },
    { id: 'user', txt: 'Selfie' },
  ];
  yesNoTypes = [
    { id: 'si', txt: 'Sí' },
    { id: 'no', txt: 'No' },
  ];
  notificationTypes = [
    { id: '', txt: 'Ninguno' },
    { id: 'notifyByMail', txt: 'Correo' },
    { id: 'playSound', txt: 'Sonido' },
    { id: 'statistic', txt: 'Estadística' },
  ];
  tags: TheTagData;
  interpreter: InterpretDetections | null = null;
  currentUrl: string = '';

  constructor(
    private dialogRef: MatDialogRef<EditimageiaconfigComponent>,
    private fb: FormBuilder,
    private modalSrv: ModalService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private mailSrv: MailService,
    private fileService: FileService,
    private imagiationSrv: ImageiationService
  ) {
    this.model = this.deserializeModel(data.model);
    this.tags = data.tags;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      modelId: [this.model.modelId, []],
      name: [this.model.name, []],
      numClasses: [this.model.numClasses, []],
      delayMillis: [this.model.delayMillis, []],
      facingMode: [this.model.facingMode, []],
      formArrayName: this.fb.array([]),
    });
    const llaves = [
      'modelId',
      'name',
      'numClasses',
      'delayMillis',
      'facingMode',
    ];
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      this.form.controls[llave].valueChanges.subscribe((value) => {
        this.changedValues(llave, value);
      });
    }
    this.buildForm();
    this.generateUrl();
  }

  generateUrl() {
    const queryParams: any = {
      mode: 'play',
      config: this.model.id,
    };
    const params = new URLSearchParams(queryParams);
    let canvas = document.getElementById('qrcanvas');
    this.currentUrl = `${location.origin}/imagiation/${
      this.model.pg
    }?${params.toString()}`;
    toCanvas(canvas, this.currentUrl, {
      width: 256,
    });
  }

  async borrarConfig(i: number, conf: any) {
    const decision = await this.modalSrv.confirm({
      title: `¿Seguro?`,
      txt: `Esta acción no se puede deshacer`,
    });
    if (!decision) {
      return;
    }
    const indice = this.model.configs.indexOf(conf);
    if (indice >= 0) {
      this.model.configs.splice(indice, 1);
      this.buildForm();
    }
  }

  agregarConfig() {
    this.model.configs.push({
      type: null,
    });
    this.buildForm();
  }

  buildForm() {
    const controlArray = this.form.get('formArrayName') as FormArray;
    controlArray.clear();

    let i = 0;
    this.model.configs.forEach((mytag) => {
      const ATTR_NAMES = [
        { name: 'type' },
        { name: 'recipients' },
        { name: 'subject' },
        { name: 'detectedTags' },
        { name: 'minScore' },
        { name: 'snapshotTimes' },
        { name: 'minSecondsBetweenMails' },
        { name: 'useSounds' },
        { name: 'useBBox' },
      ];
      const mapa: any = {};
      for (let k = 0; k < ATTR_NAMES.length; k++) {
        const attr = ATTR_NAMES[k];
        const name = attr.name;
        mapa[name] = new FormControl({
          value: mytag[name],
          disabled: false,
        });
      }
      const control = this.fb.group(mapa);
      controlArray.push(control);
      let index = i;
      control.valueChanges.subscribe((value) => {
        Object.assign(this.model.configs[index], value);
      });
      i++;
    });
  }

  changedValues(key: string, val: any) {
    //console.log(`key = ${key} val = ${val} ${typeof val}`);
    const temp: any = this.model;
    temp[key] = val;
  }

  cancelar() {
    this.dialogRef.close();
  }

  serializeModel(model1: any) {
    const model = JSON.parse(JSON.stringify(model1));
    return model;
  }

  deserializeModel(model1: any) {
    const model = JSON.parse(JSON.stringify(model1));
    return model;
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close({ model: this.serializeModel(this.model) });
    } else {
      this.modalSrv.alert({
        title: 'Ups...',
        txt: 'Verifica tus datos antes de continuar.',
      });
    }
  }

  test() {
    const payload = [
      {
        tag: 1,
        minX: 0.21801576614379883,
        minY: 0.11414144833882649,
        width: 0.3219138145446777,
        height: 0.48360114097595214,
        score: 0.5874759018421173,
      },
      {
        tag: 0,
        minX: 0.1,
        minY: 0.15,
        width: 0.2,
        height: 0.2,
        score: 0.6,
      },
    ];
    if (this.interpreter == null) {
      const configId: any = this.model.id;
      const config = this.model.configs;
      this.interpreter = new InterpretDetections(
        this.mailSrv,
        this.fileService,
        this.imagiationSrv
      );
      this.interpreter.build(configId, config, this.tags, this.model);
    }
    this.interpreter.test(payload, this.canvasRef.nativeElement, this.tags);
  }
}
