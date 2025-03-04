import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { FileService } from 'ejflab-front-lib';
import {
  ImagedetectionService,
  ImageSimpleDetData,
} from 'ejflab-front-lib';
import {
  ImageiationService,
  TheTagData,
  PlayDetectionData,
} from 'ejflab-front-lib';
import { MyColor } from '@ejfdelgado/ejflab-common/src/MyColor';
import {
  LocalModelData,
  TagContainer,
} from '../imagegallery/imagegallery.component';
import { processFile } from '../../imagiation.component';
import { InterpretDetections } from '../editimageiaconfig/processors/InterpretDetections';
import { MailService } from 'ejflab-front-lib';
import { PageData } from 'ejflab-front-lib';

@Component({
  selector: 'app-videodetection',
  templateUrl: './videodetection.component.html',
  styleUrls: ['./videodetection.component.css'],
})
export class VideodetectionComponent implements OnInit {
  @Input() actualModel: PlayDetectionData;
  @Input() page: PageData | null = null;
  @Output() detections: EventEmitter<Array<ImageSimpleDetData>> =
    new EventEmitter();
  @Output() askClose: EventEmitter<void> = new EventEmitter();
  @ViewChild('video_ref') videoRef: ElementRef;
  @ViewChild('canvas_ref') canvasRef: ElementRef;
  @ViewChild('container_preview') containerPreview: ElementRef;
  @ViewChild('container_overlay') containerOverlay: ElementRef;
  stream: MediaStream | null = null;
  inputShape: any;
  running: boolean = false;
  runningBackground: boolean = false;
  videoReady: boolean = false;
  cameraWidth: number = 0;
  cameraHeight: number = 0;
  currentTags: Array<TagContainer> = [];
  currentDetection: Array<ImageSimpleDetData> | null = null;
  tags: TheTagData = {};
  tagMap: { [key: string]: string } = {};
  numClasses: number = 0;
  styleOverlay: any = { left: '0px', top: '0px', width: '0px', height: '0px' };
  elapsedSeconds: string = '0 seg';
  canvas: any;
  interpreter: InterpretDetections;

  constructor(
    public imageDetectionSrv: ImagedetectionService,
    private imagiationSrv: ImageiationService,
    public fileService: FileService,
    private mailSrv: MailService
  ) {
    this.interpreter = new InterpretDetections(
      this.mailSrv,
      this.fileService,
      this.imagiationSrv
    );
  }

  async configure() {
    const promesas = [];
    promesas.push(this.loadTags());
    promesas.push(this.getVideo());
    await Promise.all(promesas);
    const configId: any = this.actualModel.id;
    const config = this.actualModel.configs;
    this.computeElapsedSeconds(new Date().getTime());
    this.interpreter.build(configId, config, this.tags, this.actualModel);
  }

  ngOnInit(): void {
    this.configure();
  }

  getBase64() {
    this.canvas = this.canvasRef.nativeElement;
    const video = this.videoRef.nativeElement;

    this.canvas.width = this.cameraWidth;
    this.canvas.height = this.cameraHeight;
    this.canvas
      .getContext('2d')
      .drawImage(video, 0, 0, this.cameraWidth, this.cameraHeight);

    return this.canvas;
  }

  async capturePhoto() {
    if (this.page?.id) {
      if (!this.canvas || !this.running) {
        this.getBase64();
      }
      const base64: any = this.canvas.toDataURL();
      await processFile(
        this.page.id,
        {
          base64,
          fileName: '',
        },
        this.fileService,
        this.imagiationSrv
      );
    }
  }

  async loadTags() {
    if (this.page?.id) {
      const pageId: string = this.page.id;
      const response = await this.imagiationSrv.tagsRead(pageId);
      this.tags = response.tag;
      this.computeTagMaps();
    }
  }

  startRunning() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.runningBackground = true;
    /*
    try {
      document.documentElement.requestFullscreen();
    } catch (err) {}
    */
    this.runForEver(this.actualModel.modelId, this.numClasses);
  }

  stopRunning() {
    this.running = false;
    /*
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    */
    if (this.runningBackground == false) {
      this.stopCamera();
    }
  }

  async sleep(milis: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, milis);
    });
  }

  stopCamera() {
    if (this.stream) {
      this.videoRef.nativeElement.srcObject = null;
      this.stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
    this.askClose.emit();
  }

  computeElapsedSeconds(startTime: number) {
    const delta =
      ((new Date().getTime() - startTime) / 1000).toFixed(2) + ' seg';
    this.elapsedSeconds = `${this.actualModel.name}: ${delta}`;
  }

  async runForEver(modelId: string, numClass: number) {
    while (true) {
      const startTime = new Date().getTime();
      this.getBase64();
      this.currentDetection = await this.imageDetectionSrv.detect(
        modelId,
        this.canvas,
        numClass
      );
      this.computeElapsedSeconds(startTime);

      this.recomputeCurrentImageTags();
      if (this.currentDetection) {
        await this.interpreter.test(
          this.currentDetection,
          this.canvas,
          this.tags
        );
        this.detections.emit(this.currentDetection);
      }
      if (!this.running) {
        this.runningBackground = false;
        this.stopCamera();
        break;
      }
      await this.sleep(this.actualModel.delayMillis);
    }
  }

  async toggleVideo() {
    if (this.actualModel.facingMode == 'user') {
      this.actualModel.facingMode = 'environment';
    } else {
      this.actualModel.facingMode = 'user';
    }
    await this.getVideo();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.recomputeCurrentImageTags();
  }

  async getVideo() {
    if (this.videoReady == false && this.stream != null) {
      return;
    }
    this.videoReady = false;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return await navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: this.actualModel.facingMode,
          },
        })
        .then((stream) => {
          this.stream = stream;
          this.videoRef.nativeElement.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.nativeElement.onloadedmetadata = () => {
              this.cameraWidth = this.videoRef.nativeElement.videoWidth;
              this.cameraHeight = this.videoRef.nativeElement.videoHeight;
              //console.log(`${this.cameraWidth} x ${this.cameraHeight}`);
              this.videoReady = true;
              resolve(true);
            };
          });
        });
    }
    return;
  }

  getColorFromClass(tabClass: number): string {
    return MyColor.int2colorhex(tabClass);
  }

  computeTagMaps() {
    this.tagMap = {};
    const mytags: any = this.tags;
    const llaves = Object.keys(mytags);
    this.numClasses = 0;
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      const valor = mytags[llave];
      let numberTxt;
      if (typeof valor.ref == 'string' && valor.ref.trim().length > 0) {
        numberTxt = `${valor.ref}`;
        this.tagMap[numberTxt] = valor.txt;
      } else {
        numberTxt = llave;
        this.tagMap[llave] = valor.txt;
      }
      const numberTxtReal = parseInt(numberTxt) + 1;
      if (numberTxtReal > this.numClasses) {
        this.numClasses = numberTxtReal;
      }
    }
  }

  getClassFromLabel(label: number) {
    const tags = this.tagMap;
    const numberText = `${label}`;
    const theclass = tags[numberText];
    //console.log(`Found ${label} = ${theclass}`);
    return theclass || numberText;
  }

  recomputeCurrentImageTags() {
    this.currentTags = [];
    const imageWidth = this.cameraWidth;
    const imageHeight = this.cameraHeight;
    const videoRatio1 = imageWidth / imageHeight;
    const videoRatio2 = imageHeight / imageWidth;
    const tags = this.currentDetection;

    // Esto puede ser lo mismo que el tamaño de la pantalla del navegador...
    const imageWidth1 = this.videoRef.nativeElement.clientWidth;
    const imageHeight1 = this.videoRef.nativeElement.clientHeight;

    const imageWidth2 = imageHeight1 * videoRatio1;
    const imageHeight2 = imageWidth1 * videoRatio2;

    let finalWidth = imageWidth1;
    let finalHeight = imageHeight2;

    if (imageWidth2 < finalWidth) {
      finalWidth = imageWidth2;
      finalHeight = imageHeight1;
    }

    finalWidth = Math.floor(finalWidth);
    finalHeight = Math.floor(finalHeight);

    const restanteX = imageWidth1 - finalWidth;
    const restanteY = imageHeight1 - finalHeight;
    let offsetLeft = 0;
    let offsetTop = 0;
    if (restanteX > 0) {
      offsetLeft = Math.floor(restanteX / 2);
    }
    if (restanteY > 0) {
      offsetTop = Math.floor(restanteY / 2);
    }

    this.styleOverlay = {
      left: `${offsetLeft}px`,
      top: `${offsetTop}px`,
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
    };

    if (tags) {
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        const label = tag.tag; // label

        let width = finalWidth * tag.width;
        let height = finalHeight * tag.height;
        let left = finalWidth * tag.minX;
        let top = finalHeight * tag.minY;

        this.currentTags.push({
          bbox: {
            label,
            theclass:
              this.getClassFromLabel(label) + ' ' + tag.score.toFixed(2),
            top,
            left,
            bottom: top + height,
            right: left + width,
            size: width * height,
          },
          style: {
            borderColor: this.getColorFromClass(label),
            borderStyle: 'solid',
            content: `${label}`,
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,
          },
        });
      }
    }
  }
}
