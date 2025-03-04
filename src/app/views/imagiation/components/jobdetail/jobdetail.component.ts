import { Buffer } from 'buffer';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ImageiationService,
  JobState,
  JobWorker,
  TrainingJob,
} from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';

@Component({
  selector: 'app-jobdetail',
  templateUrl: './jobdetail.component.html',
  styleUrls: ['./jobdetail.component.css'],
})
export class JobdetailComponent implements OnInit, OnDestroy {
  currentUrl: string = '';
  form: FormGroup;
  job: TrainingJob;
  pageId: string;
  user: User | null;
  isNew: boolean;
  autoActualizacion: any = null;
  workerTypes = [
    { id: JobWorker.predefined, txt: 'Básico' },
    { id: JobWorker.paid1, txt: 'Pago #1' },
  ];
  resultImages: Array<string> = [
    'val_batch0_pred.jpg',
    'confusion_matrix.png',
    'confusion_matrix_normalized.png',
    'PR_curve.png',
    'P_curve.png',
    'R_curve.png',
    'labels.jpg',
    'labels_correlogram.jpg',
    'results.png',
    'train_batch0.jpg',
    'train_batch1.jpg',
    'train_batch2.jpg',
    'val_batch0_labels.jpg',
  ];
  constructor(
    private dialogRef: MatDialogRef<JobdetailComponent>,
    private fb: FormBuilder,
    private modalSrv: ModalService,
    private imagiationSrv: ImageiationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.job = data.job;
    if (!this.job.id) {
      this.isNew = true;
    } else {
      this.isNew = false;
    }
    this.pageId = data.pageId;
    this.user = data.user;
    if (location.hostname == 'localhost') {
      this.workerTypes.unshift({ id: JobWorker.local, txt: 'Local' });
    }
  }
  ngOnDestroy(): void {
    if (this.autoActualizacion) {
      clearInterval(this.autoActualizacion);
    }
  }

  fixJob(oneJob: TrainingJob) {
    if (oneJob.state) {
      oneJob.state = oneJob.state as JobState;
    }
    if (oneJob.workerType) {
      oneJob.workerType = oneJob.workerType as JobWorker;
    }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      min_offset: [this.job.min_offset, [Validators.required]],
      max_count: [this.job.max_count, [Validators.required]],
      min_date: [
        this.job.min_date == 0 ? null : new Date(this.job.min_date),
        [],
      ],
      max_date: [
        this.job.max_date == 0 ? null : new Date(this.job.max_date),
        [],
      ],
      workerType: [this.job.workerType, [Validators.required]],
      parentModel: [this.job.parentModel, []],
      epochs: [this.job.epochs, [Validators.required]],
      imageSize: [this.job.imageSize, [Validators.required]],
    });
    const llaves = [
      'min_offset',
      'max_count',
      'min_date',
      'max_date',
      'workerType',
      'parentModel',
      'epochs',
      'imageSize',
    ];
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      this.form.controls[llave].valueChanges.subscribe((value) => {
        this.changedValues(llave, value);
      });
    }

    if (this.job.state == 'running' || this.job.state == 'pending') {
      this.autoActualizacion = setInterval(() => {
        this.updateJob();
      }, 5000);
    }
  }

  checkFinishAutoUpdate() {
    if (this.job.state !== 'running' && this.job.state !== 'pending') {
      if (this.autoActualizacion) {
        clearInterval(this.autoActualizacion);
      }
    }
  }

  changedValues(key: string, val: any) {
    //console.log(`key = ${key} val = ${val} ${typeof val}`);
    const changed = {
      key: key,
      val: val,
    };
    const temp: any = this.job;
    temp[key] = val;
  }

  cancelar() {
    this.dialogRef.close();
  }

  async updateJob() {
    if (this.job) {
      const pageId = this.job.pg;
      const jobId = this.job.id;
      if (pageId && jobId) {
        const response = await this.imagiationSrv.readJob(pageId, jobId);
        if (response.jobs.length > 0) {
          const temp = response.jobs[0];
          this.fixJob(temp);
          Object.assign(this.job, temp);
          this.checkFinishAutoUpdate();
        }
      }
    }
  }

  async tryJob() {
    if (this.job) {
      const pageId = this.job.pg;
      const jobId = this.job.id;
      if (pageId && jobId) {
        const response = await this.imagiationSrv.tryStartJob(pageId, jobId);
        if (response.status == 'ok' && response.response) {
          const contenedor = response.response;
          if (contenedor.status == 'ok') {
            const message = `Listo! ${contenedor.instanceId} ${contenedor.currentJobs}/${contenedor.maxJobs}`;
            // Se debe cambiar el estado del
            this.job.state = JobState.running;
            this.dialogRef.close(this.job);
            this.modalSrv.alert({ title: 'Información', txt: message });
          }
        }
      }
    }
  }

  canTry() {
    if (this.job) {
      return (
        this.job.pg &&
        this.job.id &&
        this.job.state != 'running' &&
        this.job.state != 'done'
      );
    } else {
      return false;
    }
  }

  canAbort() {
    if (this.job) {
      return this.isNew == false && this.job.state == JobState.pending;
    } else {
      return false;
    }
  }

  async cancelJob() {
    const responseConfirm = await this.modalSrv.confirm({
      title: `¿Abortar el entrenamiento?`,
      txt: 'Esta acción no se puede deshacer.',
    });
    if (!responseConfirm) {
      return;
    }
    // Invocar el cambio de estado
    this.job.state = JobState.abort;
    await this.imagiationSrv.saveJob('imagiation', this.pageId, this.job);
    this.dialogRef.close(this.job);
  }

  createJob() {
    if (this.form.valid) {
      this.fixJob(this.job);
      this.dialogRef.close(this.job);
    } else {
      this.modalSrv.alert({
        title: 'Ups...',
        txt: 'Verifica tus datos antes de continuar.',
      });
    }
  }

  editJob() {
    this.dialogRef.close();
  }

  apply() {
    if (this.isNew) {
      this.createJob();
    } else {
      this.editJob();
    }
  }

  completeResultImage(fileName: string) {
    const path = `srv/pg/imagiation/${this.user?.email}/${this.pageId}/jobs/${this.job.id}/${fileName}`;
    return MyConstants.SRV_ROOT + path + '?authcookie=1&max_age=30';
  }

  getModelUri() {
    const path = `srv/pg/imagiation/${this.user?.email}/${this.pageId}/jobs/${this.job.id}/weights/best.pt`;
    return Buffer.from(path, 'utf8').toString('base64');
  }

  copyModelPath() {
    navigator.clipboard.writeText(this.getModelUri());
    this.modalSrv.alert({
      title: 'Listo!',
      txt: 'Has copiado la identificación del modelo',
      buttons: [
        {
          label: 'Aceptar',
          action: () => {
            return true;
          },
        },
      ],
    });
  }
}
