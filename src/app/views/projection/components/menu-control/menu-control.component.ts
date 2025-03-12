import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { IdGen } from '@ejfdelgado/ejflab-common/src/IdGen';
import { ModuloSonido } from '@ejfdelgado/ejflab-common/src/ModuloSonido';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { MyDatesFront } from '@ejfdelgado/ejflab-common/src/MyDatesFront';

import {
  GlobalModelData,
  LocalModelData,
  Model3DData,
  Model3DDataKey,
  TheStateViewData,
  ViewModelData,
} from '../../projection.component';
import {
  VideoCanvasComponent,
  VideoCanvasEventData,
} from '../video-canvas/video-canvas.component';
import { BlobOptionsData, FileService, ModalService, TxtfileeditorComponent, TxtOptionsData } from 'ejflab-front-lib';

export interface TabElementData {
  label: string;
  id: string;
}

export interface MyOptionData {
  val: string;
  txt: string;
}

const OFFSET_MILLIS_START_TIME = 6000;

@Component({
  selector: 'app-menu-control',
  templateUrl: './menu-control.component.html',
  styleUrls: ['./menu-control.component.css'],
})
export class MenuControlComponent implements OnInit, OnChanges {
  @ViewChild('map3d2d_ref') map3d2dRef: ElementRef;
  @Input() mymodel: GlobalModelData;
  @Input() localModel: LocalModelData;
  @Input() states: TheStateViewData;
  @Output() saveEvent = new EventEmitter<void>();
  @Output() load3DModel = new EventEmitter<{
    uid: string;
    url: string | null;
  }>();
  @Output() remove3DModel = new EventEmitter<string>();
  @Output() adjustVisibilityEvent = new EventEmitter<Model3DDataKey>();
  @Output() imageOut = new EventEmitter<VideoCanvasEventData>();
  @Output() fullScreenEvent = new EventEmitter<boolean>();
  @Output() calibrateEvent = new EventEmitter<void>();
  @Output() useControlsEvent = new EventEmitter<void>();
  @Output() askErasePointEvent = new EventEmitter<string>();
  @Output() askLocatePointEvent = new EventEmitter<string>();
  @Output() changedFovEvent = new EventEmitter<number>();
  @Output() changedViewOffsetEvent = new EventEmitter<number>();
  @Output() changedViewEvent = new EventEmitter<ViewModelData>();
  @Output() askEraseAllPointsEvent = new EventEmitter<void>();
  @Output() askPlayVideo = new EventEmitter<string>();
  @Output() askcompute3d2DMaskEvent = new EventEmitter<void>();

  @ViewChildren(VideoCanvasComponent)
  videoListRef: QueryList<VideoCanvasComponent>;
  localTimeout: any = null;
  localInterval: any = null;
  localFormatTime: string = '';
  helpFOVVisible: boolean = false;
  helpViewOffsetVisible: boolean = false;

  videoOptions: Array<TabElementData> = [];

  tabOptions: Array<TabElementData> = [
    {
      label: 'Objetos 3D',
      id: 'object3d',
    },
    {
      label: 'Vistas',
      id: 'views',
    },
    {
      label: 'Play',
      id: 'play',
    },
    {
      label: 'Sand',
      id: 'sand',
    },
    {
      label: 'Debug',
      id: 'debug_local_model',
    },
  ];

  blobOptions: BlobOptionsData = {
    useRoot: MyConstants.SRV_ROOT,
    autosave: true,
  };

  blobOptionsPublic: BlobOptionsData = {
    useRoot: MyConstants.SRV_ROOT,
    autosave: true,
    isPublic: true,
    isFake: true,
  };

  textOptions: TxtOptionsData = {
    height: '200px',
    maxHeight: '200px',
    useRoot: MyConstants.SRV_ROOT,
  };

  constructor(
    public fileService: FileService,
    public modalService: ModalService,
  ) { }

  ngOnInit(): void {
    this.computeCameraOptions();
  }

  async save3d2DMask(myText: string) {
    const mapping = this.getMap3d2dRefComponent();
    if (mapping == null) {
      return;
    }
    // Guardar el mapeo
    await mapping.setValueAndSave(myText);
  }

  async compute3d2DMask() {
    // ask the parent
    this.askcompute3d2DMaskEvent.emit();
  }

  saveMap3d2d(dato: string | null) {
    if (dato !== null) {
      this.mymodel.sand.map3d2dUrl = dato;
    }
  }

  openTab(tab: string) {
    this.localModel.currentTab = tab;
  }

  askPlayVideoLocal(labelCamera: string) {
    // Busco el label en la lista
    let cameraId = null;
    const videoOptions = this.videoOptions;
    for (let i = 0; i < videoOptions.length; i++) {
      const actual = videoOptions[i];
      if (actual.label == labelCamera) {
        cameraId = actual.id;
      }
    }
    if (cameraId) {
      this.askPlayVideo.emit(cameraId);
    } else {
      this.modalService.error(
        new Error('Por favor selecciona otra vez la cámara')
      );
    }
  }

  autoStartPlay() {
    const videos = this.videoListRef;
    videos.forEach(async (item) => {
      await item.play();
    });
  }

  getEnvironmentOptions() {
    return [
      { txt: '3d', val: '3d' },
      { txt: 'video', val: 'video' },
    ];
  }

  changedEnvironment(environmentId: string) {
    console.log(`environmentId = ${environmentId}`);
  }

  async computeCameraOptions() {
    if (
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices
    ) {
      navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      );
      this.videoOptions = [];
      for (let i = 0; i < videoDevices.length; i++) {
        const actual = videoDevices[i];
        this.videoOptions.push({ id: actual.groupId, label: actual.label });
      }
    }
  }

  changedCamera(cameraId: string) {
    this.saveEvent.emit();
  }

  clearOldExecution() {
    if (this.localTimeout != null) {
      clearTimeout(this.localTimeout);
      this.localTimeout = null;
    }
    if (this.localInterval != null) {
      clearInterval(this.localInterval);
      this.localInterval = null;
    }
  }

  stopPlayer() {
    this.clearOldExecution();
    const videos = this.videoListRef;
    videos.forEach(async (item) => {
      await item.stop();
    });
  }

  configureTimerToPlay(startTime: number) {
    if (startTime == 0) {
      this.stopPlayer();
    } else {
      this.clearOldExecution();
      const ahora = new Date().getTime();
      const diferencia = startTime - ahora;
      this.turnReferencePoints(false);
      this.localTimeout = setTimeout(() => {
        this.mymodel.globalState.playingState = 'preparing';
        this.autoStartPlay();
        this.saveEvent.emit();
      }, diferencia);

      this.localInterval = setInterval(() => {
        const ahoraLocal = new Date().getTime();
        this.localFormatTime = MyDatesFront.toHHMMssmm(ahoraLocal - startTime);
      }, 250);
    }
  }

  prepareToPlay() {
    // Asigna la fecha y hora para iniciar.
    if (!this.mymodel.globalState) {
      this.mymodel.globalState = {};
    }
    this.mymodel.globalState.playingState = 'preparing';
    this.mymodel.globalState.playTime =
      new Date().getTime() + OFFSET_MILLIS_START_TIME;
    this.saveEvent.emit();
  }

  callToStop() {
    this.mymodel.globalState.playingState = 'stoped';
    this.mymodel.globalState.playTime = 0;
    this.saveEvent.emit();
  }

  askErasePoint(key: string) {
    this.askErasePointEvent.emit(key);
  }

  askEraseAllPoints() {
    this.askEraseAllPointsEvent.emit();
  }

  askLocatePoint(key: string) {
    this.askLocatePointEvent.emit(key);
  }

  calibrateView() {
    this.calibrateEvent.emit();
  }

  useOrbitControls() {
    this.useControlsEvent.emit();
  }

  turnReferencePoints(value: boolean) {
    this.states.seeCalibPoints = value;
  }

  turnFullscreen(value: boolean) {
    this.fullScreenEvent.emit(value);
  }

  format2DPoint(point: any) {
    if (point) {
      return `${point.x.toFixed(2)}, ${point.y.toFixed(2)}`;
    } else {
      return '-';
    }
  }

  format3DPoint(point: any) {
    if (point) {
      return `${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(
        2
      )}`;
    } else {
      return '-';
    }
  }

  adjustVisibility(key: string, model: Model3DData) {
    const name = model.name;
    console.log(model.isVisible);
    this.adjustVisibilityEvent.emit({
      model,
      key,
    });
  }

  async add3DModel() {
    const id = await IdGen.nuevo();
    if (id == null) {
      return;
    }
    if (!this.mymodel.models) {
      this.mymodel.models = {};
    }
    this.mymodel.models[id] = {
      name: `Model ${id}`,
      startTime: 0,
      isVisible: true,
      texture: {
        width: 192,
        height: 108,
      },
    };
    this.saveEvent.emit();
  }

  async delete3DModel(key: string) {
    if (!(key in this.mymodel.models)) {
      return;
    }
    const actual: Model3DData = this.mymodel.models[key];
    const response = await this.modalService.confirm({
      title: `¿Seguro que desea borrar el modelo ${actual.name}?`,
      txt: 'Esta acción no se puede deshacer.',
    });
    if (!response) {
      return;
    }
    const promesasBorrar = [];
    if (actual.objUrl) {
      promesasBorrar.push(this.fileService.delete(actual.objUrl));
    }
    if (actual.videoUrl) {
      promesasBorrar.push(this.fileService.delete(actual.videoUrl));
    }
    await Promise.all(promesasBorrar);
    delete this.mymodel.models[key];
    this.saveEvent.emit();
    this.remove3DModel.emit(key);
  }

  calcularFieldOfView() {
    const currentView = this.localModel.currentView;
    if (!currentView) {
      return;
    }
    if (!currentView.W || !currentView.D) {
      return;
    }
    const fieldOfView =
      (180 / Math.PI) * Math.atan2(currentView.W, 2 * currentView.D);
    currentView.fov = fieldOfView;
    this.changedFovEvent.emit(currentView.fov);
    this.saveEvent.emit();
  }

  calcularViewOffset() {
    const currentView = this.localModel.currentView;
    if (!currentView) {
      return;
    }
    if (!currentView.B || !currentView.H) {
      return;
    }
    currentView.viewOffset = currentView.B / currentView.H;
    this.changedViewOffsetEvent.emit(currentView.viewOffset);
    this.saveEvent.emit();
  }

  toggleFOVHelp() {
    this.helpFOVVisible = !this.helpFOVVisible;
  }

  toggleViewOffsetHelp() {
    this.helpViewOffsetVisible = !this.helpViewOffsetVisible;
  }

  changedView(viewId: string) {
    this.localModel.currentView = this.mymodel.calib[viewId];
    this.changedFovEvent.emit(this.localModel.currentView.fov);
    this.changedViewEvent.emit(this.localModel.currentView);
    this.changedViewOffsetEvent.emit(this.localModel.currentView.viewOffset);
  }

  async removeView(viewId: string) {
    const response = await this.modalService.confirm({
      title: `¿Seguro que desea borrar la vista ${this.mymodel.calib[viewId].name}?`,
      txt: 'Esta acción no se puede deshacer.',
    });
    if (!response) {
      return;
    }
    delete this.mymodel.calib[viewId];
    this.localModel.currentView = null;
    this.localModel.currentViewName = null;
    this.saveEvent.emit();
  }

  async addView() {
    const id = await IdGen.nuevo();
    if (id == null) {
      return;
    }
    const llavesViejas = Object.keys(this.mymodel.calib);
    const count = llavesViejas.length + 1;
    this.mymodel.calib[id] = {
      name: `Vista ${count}`,
      pairs: {},
      fov: 35,
      viewOffset: 0,
    };
    if (this.localModel.currentViewName == null) {
      this.localModel.currentViewName = id;
      this.changedView(id);
    }
    this.saveEvent.emit();
  }

  ngOnChanges(changes: any) {
    //console.log(JSON.stringify(changes));
  }

  async playSound() {
    try {
      const response = await ModuloSonido.preload(['/assets/sounds/end.mp3']);
      await ModuloSonido.play('/assets/sounds/end.mp3');
    } catch (err: any) {
      this.modalService.error(err);
    }
  }

  getViewOptionsList(): Array<MyOptionData> {
    const response: Array<MyOptionData> = [];
    const llaves = Object.keys(this.mymodel.calib);
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      const actual: MyOptionData = {
        val: llave,
        txt: this.mymodel.calib[llave].name,
      };
      response.push(actual);
    }
    return response;
  }

  getMap3d2dRefComponent() {
    if (!this.map3d2dRef) {
      return null;
    }
    const componentReal = this.map3d2dRef as unknown as TxtfileeditorComponent;
    if (!componentReal) {
      return null;
    }
    return componentReal;
  }
}
