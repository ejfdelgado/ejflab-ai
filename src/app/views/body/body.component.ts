import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';

import { TupleService, AuthService, BackendPageService, BaseComponent, BlobOptionsData, CallService, FileSaveResponseData, FileService, FlowchartService, ImagepickerOptionsData, ModalService, TxtOptionsData, WebcamService } from 'ejflab-front-lib';
import { tracker } from 'srcJs/tracker';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrl: './body.component.css'
})
export class BodyComponent extends BaseComponent implements OnInit, OnDestroy {
  poses: any = {};
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
  }

  override async ngOnDestroy() {
    super.ngOnDestroy();
  }

  async startTracking() {
    tracker.run('camera');
  }

  async stopTracking() {
    tracker.pause();
  }
}
