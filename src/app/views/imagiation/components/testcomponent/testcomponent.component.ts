import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageSimpleDetData } from 'ejflab-front-lib';
import {
  ImageiationService,
  PlayDetectionData,
  TheTagData,
} from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { Auth } from '@angular/fire/auth';
import { EditimageiaconfigComponent } from '../editimageiaconfig/editimageiaconfig.component';
import { PageData } from 'ejflab-front-lib';

//https://github.com/hugozanini/TFJS-object-detection/blob/master/src/index.js
//https://github.com/Hyuto/yolov8-tfjs/blob/master/src/App.jsx
//https://github.com/Hyuto/yolov8-tfjs/blob/master/src/utils/detect.js

export interface DataQuery {
  max: number;
  offset: number;
}

@Component({
  selector: 'app-testcomponent',
  templateUrl: './testcomponent.component.html',
  styleUrls: ['./testcomponent.component.css'],
})
export class TestcomponentComponent implements OnInit {
  @Input() page: PageData | null = null;

  currentPlayDetection: PlayDetectionData | null = null;
  loadedConfigurations: Array<PlayDetectionData> = [];
  tags: TheTagData;
  numClasses: number = 0;
  queryConfs: DataQuery = {
    max: 10,
    offset: 0,
  };

  constructor(
    private modalSrv: ModalService,
    public dialog: MatDialog,
    private imagiationSrv: ImageiationService,
    private auth: Auth
  ) {}

  async loadTags() {
    if (this.page?.id) {
      const pageId: string = this.page.id;
      const response = await this.imagiationSrv.tagsRead(pageId);
      this.tags = response.tag;
      this.numClasses = Object.keys(this.tags).length;
    }
  }

  ngOnInit(): void {
    const p1 = this.autoLoad();
    const p2 = this.loadTags();
    p2.then(() => {
      this.readQueryparams();
    });
  }

  readQueryParam(
    urlParams: URLSearchParams,
    name: string,
    type: string,
    defValue: any
  ) {
    let val = defValue;
    const raw = urlParams.get(name);
    if (type == 'number') {
      if (raw != null) {
        val = parseInt(raw);
        if (isNaN(val)) {
          val = defValue;
        }
      }
    } else {
      val = raw;
    }
    return val;
  }

  async readQueryparams() {
    const urlParams = new URLSearchParams(window.location.search);
    const configId = this.readQueryParam(urlParams, 'config', 'string', '');
    if (configId && configId.trim().length > 0) {
      // Load the config
      if (this.page?.id) {
        const pageId: string = this.page.id;
        const response = await this.imagiationSrv.readConfig(pageId, configId);
        const confs = response.confs;
        if (confs instanceof Array && confs.length > 0) {
          // Open the play mode
          this.executeConfiguration(confs[0]);
        }
      }
    }
  }

  async createConfiguration() {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(EditimageiaconfigComponent, {
      data: {
        tags: this.tags,
        model: {
          name: '',
          modelId: '',
          numClasses: this.numClasses,
          delayMillis: 300,
          facingMode: 'environment',
          configs: [],
        },
      },
      panelClass: 'edit-user-dialog-container',
    });
    const response = await new Promise<any>((resolve) => {
      dialogRef.afterClosed().subscribe((result) => {
        resolve(result);
      });
    });
    if (response) {
      // Copy the possible changed fields
      if (response.model) {
        await this.imagiationSrv.saveConfig(
          'imagiation',
          this.page?.id,
          response.model
        );
        this.loadedConfigurations.push(response.model);
      }
    }
  }

  async openConfiguration(configuration: PlayDetectionData) {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(EditimageiaconfigComponent, {
      data: {
        tags: this.tags,
        model: configuration,
      },
      panelClass: 'edit-user-dialog-container',
    });
    const response = await new Promise<any>((resolve) => {
      dialogRef.afterClosed().subscribe((result) => {
        resolve(result);
      });
    });
    if (response) {
      // Copy the possible changed fields
      await this.imagiationSrv.saveConfig(
        'imagiation',
        this.page?.id,
        response.model
      );
      Object.assign(configuration, response.model);
    }
  }

  async eraseConfiguration(configuration: PlayDetectionData) {
    if (!this.page?.id) {
      return;
    }
    const decision = await this.modalSrv.confirm({
      title: `¿Seguro?`,
      txt: `Esta acción no se puede deshacer`,
    });
    if (!decision) {
      return;
    }
    const indice = this.loadedConfigurations.indexOf(configuration);
    if (indice >= 0) {
      await this.imagiationSrv.deleteConfig(this.page?.id, configuration);
      this.loadedConfigurations.splice(indice, 1);
    }
  }

  async askForConfs() {
    if (!this.page?.id) {
      return;
    }
    const response = await this.imagiationSrv.pageConf(
      this.page.id,
      this.queryConfs
    );
    const readed = response;
    for (let i = 0; i < readed.length; i++) {
      const oneConf = readed[i];
      if (!oneConf.configs) {
        oneConf.configs = [];
      }
      this.loadedConfigurations.push(oneConf);
    }
    this.queryConfs.offset = this.loadedConfigurations.length;
  }

  async autoLoad() {
    this.askForConfs();
  }

  executeConfiguration(configuration: PlayDetectionData) {
    this.currentPlayDetection = configuration;
  }

  detected(detections: Array<ImageSimpleDetData>) {
    //console.log(JSON.stringify(detections, null, 4));
  }

  askClose() {
    this.currentPlayDetection = null;
  }

  getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const modelId = urlParams.get('model');
    return {
      modelId,
    };
  }
}
