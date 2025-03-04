import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Auth, User } from '@angular/fire/auth';
import {
  ImageiationService,
  JobDataQuery,
  TrainingJob,
  JobState,
  JobWorker,
} from 'ejflab-front-lib';
import { JobdetailComponent } from '../jobdetail/jobdetail.component';
import { ModuloSonido } from '@ejfdelgado/ejflab-common/src/ModuloSonido';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { PageData } from 'ejflab-front-lib';

@Component({
  selector: 'app-jobgallery',
  templateUrl: './jobgallery.component.html',
  styleUrls: ['./jobgallery.component.css'],
})
export class JobgalleryComponent implements OnInit {
  @Input() page: PageData | null = null;
  loadedJobs: Array<TrainingJob> = [];
  user: User | null;
  watchTimer: NodeJS.Timeout | null = null;
  currentJobs: number = 0;
  queryJobs: JobDataQuery = {
    max: 10,
    offset: 0,
  };
  constructor(
    public dialog: MatDialog,
    private imagiationSrv: ImageiationService,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.user = user;
        this.askForJobs();
      } else {
        this.user = null;
        this.loadedJobs = [];
      }
    });
  }

  async askForJobs() {
    if (!this.page?.id) {
      return;
    }
    const response = await this.imagiationSrv.pageJobs(
      this.page.id,
      this.queryJobs
    );
    const readed = response.jobs;
    for (let i = 0; i < readed.length; i++) {
      const oneJob = readed[i];
      this.fixJob(oneJob);
      this.loadedJobs.push(oneJob);
    }
    this.queryJobs.offset = this.loadedJobs.length;
  }

  fixJob(oneJob: TrainingJob) {
    if (oneJob.state) {
      oneJob.state = oneJob.state as JobState;
    }
    if (oneJob.workerType) {
      oneJob.workerType = oneJob.workerType as JobWorker;
    }
  }

  async openJob(job: TrainingJob) {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(JobdetailComponent, {
      data: {
        pageId: this.page.id,
        job: job,
        user: this.user,
      },
      panelClass: 'edit-user-dialog-container',
    });
    const response = await new Promise<TrainingJob | null | undefined>(
      (resolve) => {
        dialogRef.afterClosed().subscribe((result) => {
          resolve(result);
        });
      }
    );
    if (response) {
      // Copy the possible changed fields
      job.state = response.state;
    }
  }

  async createJob() {
    if (!this.page?.id) {
      return;
    }
    const ahora = new Date().getTime();
    const brandNewJob: TrainingJob = {
      epochs: 100,
      imageSize: 640,
      max: 20, //Cuantas lecturas hace en cada solicitud
      max_count: 0,
      max_date: 0,
      min_date: 0,
      min_offset: 0,
      offset: 0,
      created: ahora,
      updated: ahora,
      state: JobState.pending,
      workerType: JobWorker.predefined,
      pageType: 'imagiation',
    };
    const dialogRef = this.dialog.open(JobdetailComponent, {
      data: {
        pageId: this.page.id,
        job: brandNewJob,
      },
      panelClass: 'edit-user-dialog-container',
    });
    const response = await new Promise<TrainingJob | null | undefined>(
      (resolve) => {
        dialogRef.afterClosed().subscribe((result) => {
          resolve(result);
        });
      }
    );
    if (response) {
      // Se debe tomar el elemento configurado
      const created = await this.imagiationSrv.saveJob(
        'imagiation',
        this.page.id,
        response
      );
      const oneJob = created.jobs[0];
      this.loadedJobs.unshift(oneJob);
      this.queryJobs.offset = this.loadedJobs.length;
    }
  }

  playSound(argumento: string) {
    ModuloSonido.play(`${MyConstants.SRV_ROOT}assets/sounds/${argumento}`);
  }

  async startWatch() {
    const MINUTES = 10;
    const SECONDS = 60;
    if (this.watchTimer) {
      clearTimeout(this.watchTimer);
      this.watchTimer = null;
    }
    let response = await this.imagiationSrv.watchServer();
    this.currentJobs = response.response.currentJobs;
    if (this.currentJobs == 0) {
      return;
    }
    this.watchTimer = setTimeout(async () => {
      this.currentJobs = response.response.currentJobs;
      if (this.currentJobs > 0) {
        this.startWatch();
      } else {
        this.playSound('success.mp3');
      }
    }, 1000 * SECONDS * MINUTES);
  }
}
