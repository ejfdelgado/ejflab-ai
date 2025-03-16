import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';

import {
  TupleService,
  AuthService,
  BackendPageService,
  BaseComponent,
  CallService,
  FileService, FlowchartService,
  ModalService,
  WebcamService,
  IndicatorService,
  Wait
} from 'ejflab-front-lib';
import { tracker } from 'srcJs/tracker';
import * as tf from '@tensorflow/tfjs';
import { BodyData, BodyState } from '../threejs/threejs-body/types';
import { ThreejsBodyComponent } from '../threejs/threejs-body/threejs-body.component';
import { ModuloSonido } from '@ejfdelgado/ejflab-common/src/ModuloSonido';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrl: './body.component.css'
})
export class BodyComponent extends BaseComponent implements OnInit, OnDestroy {
  @ViewChild('child_reference') childComponent: ThreejsBodyComponent;
  poses: BodyData[] = [];
  states: BodyState[] = [];
  activity: Wait | null = null;
  started: boolean = false;

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
    flowchartSrv: FlowchartService,
    callService: CallService,
    auth: Auth,
    public indicatorSrv: IndicatorService,
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
  }

  async initializeBodyTracker() {
    /*
        MoveNetSinglePoseLightning
        MoveNetSinglePoseThunder
        MoveNetMultiPoseLightning
        PoseNetMobileNetV1
        PoseNetResNet50
        BlazePoseLite
        BlazePoseHeavy
        BlazePoseFull
        */
    tracker.setModel('BlazePoseLite');
    /*
    tracker.detectorConfig = {
        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
        enableSmoothing: true,
        multiPoseMaxDimension: 256,
        enableTracking: true,
        trackerType: poseDetection.TrackerType.BoundingBox
    }
    tracker.minScore = 0.35;
    */
    tracker.elCanvas = '#canvas';
    tracker.elVideo = '#video';
    tracker.enable3D = false;
    // tracker.run('video') // takes video from a movie file (e.g., mp4)
    // tracker.run('stream') // takes video from an m3u8 online stream
    tracker.on('beforeupdate', (poses: any) => {
      this.poses = poses;
    });
  }

  override bindEvents() {
    //
  }

  override async ngOnInit() {
    await super.ngOnInit();
    await tf.ready();
    this.initializeBodyTracker();
    const response = await ModuloSonido.preload([
      '/assets/sounds/button.mp3',
      '/assets/sounds/clap.mp3',
      '/assets/sounds/on.mp3',
      '/assets/sounds/on1.mp3',
      '/assets/sounds/on2.mp3',
      '/assets/sounds/off.mp3',
      '/assets/sounds/nature.mp3',
      '/assets/sounds/accepted.mp3',
    ]);
  }

  override async ngOnDestroy() {
    super.ngOnDestroy();
  }

  async startTracking() {
    this.started = true;
    this.enterFullScreen();
    ModuloSonido.play('/assets/sounds/nature.mp3', true);
    ModuloSonido.play('/assets/sounds/button.mp3');
    this.activity = this.indicatorSrv.start();
    tracker.run('camera');
  }

  async stopTracking() {
    tracker.pause();
  }

  async renderUpdate(event: any) {
    if (this.activity != null) {
      this.activity.done();
      this.activity = null;
      ModuloSonido.play('/assets/sounds/accepted.mp3');
    }
    // Means the renderer render
  }

  enterFullScreen() {
    const element = document.documentElement; // Target the entire page

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any)['mozRequestFullScreen']) { // Firefox
      (element as any)['mozRequestFullScreen']();
    } else if ((element as any)['webkitRequestFullscreen']) { // Chrome, Safari, and Opera
      (element as any)['webkitRequestFullscreen']();
    } else if ((element as any)['msRequestFullscreen']) { // IE/Edge
      (element as any)['msRequestFullscreen']();
    }
  }
}
