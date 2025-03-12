import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { IdGen } from '@ejfdelgado/ejflab-common/src/IdGen';
import { CsvParser } from '@ejfdelgado/ejflab-common/src/CsvParser';
import { CsvFormatter } from '@ejfdelgado/ejflab-common/src/CsvFormatter';

import { AuthService, BackendPageService, BaseComponent, CallService, ElementItemData, ElementPairItemData, FileResponseData, FileService, FlowchartService, IndicatorService, LoginService, ModalService, OptionData, ScrollFilesActionData, ScrollnavComponent, TupleService, WebcamService } from 'ejflab-front-lib';
import { MyTensorflowData } from '../tensorflow/tensorflow/tensorflow.component';
import { ThreejsComponent } from '../threejs/threejs/threejs.component';

type VIEW_OPTIONS = 'prejson' | 'threejs' | 'tensorflow';
type FILE_VIEW_OPTIONS = 'csv' | 'tensorflow';
type TENSORFLOW_DETAIL_VIEW_OPTIONS = 'configuration' | 'training' | 'data';

export interface HumanPoseLocalModel {
  //archivosCsv: { [key: string]: ElementItemData };
  //data: MyTensorflowDataData;
  //tensorflow: MyTensorflowData | null;
  //archivosTensorflow: { [key: string]: ElementItemData };
  timeline: Array<any>;
}

export interface TimeLineTracker {
  loadDate: number;
  changedDate: number;
}

@Component({
  selector: 'app-humanpose',
  templateUrl: './humanpose.component.html',
  styleUrls: ['./humanpose.component.css'],
})
export class HumanposeComponent
  extends BaseComponent
  implements OnInit, OnDestroy {
  @ViewChild('three_ref') threeRef: ElementRef;
  neuralNetworkModel: MyTensorflowData | null = null;
  model: HumanPoseLocalModel = {
    timeline: [],
  };
  @ViewChild('myScrollNav')
  scrollNav: ScrollnavComponent;
  public extraOptions: Array<OptionData> = [];
  scrollFiles1Selected: ElementPairItemData | null = null;
  scrollFiles2Selected: ElementPairItemData | null = null;
  public scrollFiles1Actions: Array<ScrollFilesActionData> = [];
  public scrollFiles2Actions: Array<ScrollFilesActionData> = [];
  public theTimeLineTracker: { [key: string]: TimeLineTracker } = {};
  public listedFiles: FILE_VIEW_OPTIONS = 'csv';
  public currentView: VIEW_OPTIONS = 'prejson';
  public tensorflowDetail: TENSORFLOW_DETAIL_VIEW_OPTIONS = 'data';

  constructor(
    public override route: ActivatedRoute,
    public override pageService: BackendPageService,
    public override cdr: ChangeDetectorRef,
    public override authService: AuthService,
    public override dialog: MatDialog,
    public override tupleService: TupleService,
    public override fileService: FileService,
    public override modalService: ModalService,
    public override webcamService: WebcamService,
    public loginSrv: LoginService,
    private indicator: IndicatorService,
    flowchartSrv: FlowchartService,
    callService: CallService,
    auth: Auth
  ) {
    super(
      flowchartSrv,
      callService,
      route,
      pageService,
      cdr,
      authService,
      dialog,
      tupleService,
      fileService,
      modalService,
      webcamService,
      auth
    );
    this.extraOptions.push({
      action: () => {
        this.setView('threejs');
      },
      icon: 'directions_run',
      label: 'Espacio 3D',
    });
    this.extraOptions.push({
      action: () => {
        this.setView('tensorflow');
      },
      icon: 'psychology',
      label: 'Red Neuronal',
    });
    this.extraOptions.push({
      action: () => {
        this.setView('prejson');
      },
      icon: 'bug_report',
      label: 'Debug',
    });
    this.scrollFiles1Actions.push({
      callback: this.uploadCsvFile.bind(this),
      icon: 'upload_file',
      label: 'Subir CSV',
    });
    this.scrollFiles1Actions.push({
      callback: this.saveAll.bind(this),
      icon: 'save',
      label: 'Guardar',
    });
    this.scrollFiles2Actions.push({
      callback: this.addTensorflowModel.bind(this),
      icon: 'add',
      label: 'Agregar Red',
    });
    this.scrollFiles2Actions.push({
      callback: this.saveAll.bind(this),
      icon: 'save',
      label: 'Guardar',
    });
  }

  override bindEvents() {
    //
  }

  getLocalTitle(): string {
    let myTitle = '';
    if (this.scrollFiles1Selected != null) {
      myTitle += this.scrollFiles1Selected.value.name;
    } else {
      myTitle += 'Archivo de Datos';
    }
    myTitle += ' / ';
    if (this.scrollFiles2Selected != null) {
      myTitle += this.scrollFiles2Selected.value.name;
    } else {
      myTitle += 'Red Neuronal';
    }
    return myTitle;
  }

  override onTupleReadDone() {
    if (!this.tupleModel.data) {
      this.tupleModel.data = {
        in: [],
        out: {
          column: '',
          min: 0,
          max: 1,
          ngroups: 0,
        },
      };
    }
    super.onTupleReadDone();
  }

  override onTupleWriteDone() {
    console.log('Writed OK!');
  }

  setView(type: VIEW_OPTIONS) {
    this.currentView = type;

    if (type == 'threejs') {
      setTimeout(() => {
        if (this.threeRef) {
          console.log(this.threeRef);
          (this.threeRef as unknown as ThreejsComponent).onResize(null);
        }
      }, 0);
    }
  }

  async uploadCsvFile() {
    const processFileThis = this.processFile.bind(this);
    this.fileService.sendRequest(
      { type: 'file', mimeType: 'text/plain, text/csv' },
      processFileThis
    );
  }

  async processFile(responseData: FileResponseData) {
    const wait = this.indicator.start();
    try {
      const id = await IdGen.nuevo();
      if (typeof id == 'string') {
        const nuevoArchivo: ElementItemData = {
          name: responseData.fileName as string,
          date: new Date().getTime(),
          checked: false,
          url: '',
        };
        const response = await this.saveFile({
          base64: responseData.base64 as string,
          fileName: `csv/${id}.csv`,
        });
        nuevoArchivo.url = response.key;
        if (!('archivosCsv' in this.tupleModel)) {
          this.tupleModel.archivosCsv = {};
        }
        this.tupleModel.archivosCsv[id] = nuevoArchivo;
      }
    } catch (err) { }
    wait.done();
  }

  async addTensorflowModel() {
    const id = await IdGen.nuevo();
    if (!('archivosTensorflow' in this.tupleModel)) {
      this.tupleModel.archivosTensorflow = {};
    }
    const nuevoArchivo: ElementItemData = {
      name: `Red ${id}`,
      url: '',
      date: new Date().getTime(),
      checked: false,
      otherData: {
        layers: [],
        compile: {
          loss: 'binaryCrossentropy',
          metrics: ['accuracy'],
        },
        fit: {
          shuffle: true,
          epochs: 20,
          validationSplit: 0.1,
        },
      },
    };

    if (typeof id == 'string') {
      this.tupleModel.archivosTensorflow[id] = nuevoArchivo;
    }
  }

  async deleteCsvFile(pair: ElementPairItemData) {
    const response = await this.modalService.confirm({
      title: `¿Seguro que desea borrar ${pair.value.name}?`,
      txt: 'Esta acción no se puede deshacer.',
    });
    if (!response) {
      return;
    }
    if (pair.key in this.tupleModel.archivosCsv) {
      const wait = this.indicator.start();
      try {
        await this.fileService.delete(pair.value.url);
        delete this.tupleModel.archivosCsv[pair.key];
      } catch (err) { }
      wait.done();
    }
  }

  async deleteTensorflowFile(pair: ElementPairItemData) {
    const response = await this.modalService.confirm({
      title: `¿Seguro que desea borrar ${pair.value.name}?`,
      txt: 'Esta acción no se puede deshacer.',
    });
    if (!response) {
      return;
    }
    if (pair.key in this.tupleModel.archivosTensorflow) {
      const wait = this.indicator.start();
      try {
        if (pair.value.url != '') {
          await this.fileService.delete(pair.value.url);
        }
        delete this.tupleModel.archivosTensorflow[pair.key];
      } catch (err) { }
      wait.done();
    }
  }

  markCurrentFileAsChanged() {
    if (this.scrollFiles1Selected != null) {
      const key = this.scrollFiles1Selected.key;
      const actual = this.theTimeLineTracker[key];
      if (actual) {
        const ahora = new Date().getTime();
        actual.changedDate = ahora;
      }
    }
  }

  async saveAll() {
    this.saveTuple();
    // Recorro el tracker
    const llaves = Object.keys(this.theTimeLineTracker);
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      const actual = this.theTimeLineTracker[llave];
      if (actual.changedDate > actual.loadDate) {
        // Force to write
        const timeline = this.model.timeline;
        const myParser = new CsvFormatter();
        myParser.setSeparator(';');
        try {
          const header = this.getHeaderDefinition();
          const csvContent = myParser.parse(timeline, header, true, '');
          await this.saveTextFile({
            base64: csvContent,
            fileName: `csv/${llave}.csv`,
          });
        } catch (err: any) {
          this.modalService.error(err);
        }
      }
    }
  }

  getHeaderDefinition(useFilter = ''): string {
    let header = '';
    // Itero los inputs
    const columnasIn = this.tupleModel?.data?.in;
    if (columnasIn instanceof Array) {
      for (let j = 0; j < columnasIn.length; j++) {
        const columnName = columnasIn[j].column;
        header += columnName + useFilter + ';';
      }
      const outData = this.tupleModel?.data?.out;
      if (outData && outData.column) {
        // Tomo el output
        header += outData.column + useFilter;
        return header;
      }
    }
    throw new Error('Se debe configurar primero las entradas y salida');
  }

  async showPose(row: any) {
    console.log(`Ask to show in 3d renderer ${JSON.stringify(row)}`);
  }

  async openCsvFile(oneFile: ElementPairItemData) {
    const wait = this.indicator.start();
    try {
      this.scrollFiles1Selected = oneFile;
      const url = oneFile.value.url;
      const dataCsv = await this.fileService.readPlainText(url);
      const parser = new CsvParser();
      parser.registerFunction('number', (val: any) => {
        return parseFloat(val);
      });
      const skipFirstLine = true;
      const header: any = this.getHeaderDefinition('|number');
      this.model.timeline = parser.parse(dataCsv, header, skipFirstLine);
      const ahora = new Date().getTime();
      this.theTimeLineTracker = {}; // Solo puedo tener uno abierto...
      this.theTimeLineTracker[oneFile.key] = {
        loadDate: ahora,
        changedDate: ahora,
      };
      this.setView('threejs');
      setTimeout(() => {
        this.scrollNav.computeDimensions();
        this.scrollNav.computeWindow();
        this.scrollNav.detectChanges();
      }, 0);
    } catch (err) { }
    wait.done();
  }

  async openTensorflowFile(oneFile: ElementPairItemData) {
    this.scrollFiles2Selected = oneFile;
    const otherData = oneFile.value.otherData as MyTensorflowData;
    this.neuralNetworkModel = otherData;
    this.setView('tensorflow');
    this.tensorflowDetail = 'training';
  }

  showFiles(key: FILE_VIEW_OPTIONS) {
    this.listedFiles = key;
  }

  showTensorflowDetail(key: TENSORFLOW_DETAIL_VIEW_OPTIONS) {
    this.tensorflowDetail = key;
  }

  override async ngOnInit() {
    await super.ngOnInit();
  }

  override async ngOnDestroy() {
    super.ngOnDestroy();
  }
}
