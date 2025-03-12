import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { HttpService } from 'ejflab-front-lib';

export interface VideoCanvasOptions {
  width: number;
  height: number;
}

export interface VideoCanvasEventData {
  uid: string;
  video: HTMLVideoElement;
}

@Component({
  selector: 'app-video-canvas',
  templateUrl: './video-canvas.component.html',
  styleUrls: ['./video-canvas.component.css'],
})
export class VideoCanvasComponent implements OnInit, OnChanges {
  @ViewChild('video') videoRef: ElementRef;
  public oldObjectUrl: string | null = null;
  public currentUrl: string | null = null;
  public previousUrl: SafeUrl | null = null;
  private canvas: HTMLCanvasElement;
  private video: HTMLVideoElement | null = null;
  private context: CanvasRenderingContext2D | null;
  @Input() timeSeconds: number;
  @Input() uid: string;
  @Input() useLoop?: boolean;
  @Input() useVideo: boolean | null;
  @Input() url: string | null;
  @Input() options: VideoCanvasOptions;
  @Output() imageOut = new EventEmitter<VideoCanvasEventData>();
  constructor(
    private sanitizer: DomSanitizer,
    private readonly httpSrv: HttpService
  ) { }

  ngOnChanges(changes: any) {
    let useVideo = false;
    if ('useVideo' in changes || this.useVideo === true) {
      if (this.useVideo === true) {
        useVideo = true;
      } else if (changes.useVideo.currentValue === true) {
        useVideo = true;
      }
    }

    if (useVideo) {
      if ('url' in changes || typeof this.url == 'string') {
        if (typeof this.url == 'string') {
          this.configureVideo(this.url);
        } else {
          const url = changes.url;
          const theUrl = url.currentValue;
          this.configureVideo(theUrl);
        }
      }
    }

    if ('timeSeconds' in changes) {
      this.goToFrame(changes.timeSeconds.currentValue);
    }
  }

  async play() {
    if (!this.video) {
      //throw new Error(`No hay video para ${this.uid}`);
      return;
    }
    this.video.loop = this.useLoop === true;
    return this.video.play();
  }

  async stop() {
    if (!this.video) {
      //throw new Error(`No hay video para ${this.uid}`);
      return;
    }
    this.video.currentTime = 0;
    this.video.pause();
  }

  goToFrame(second: number) {
    if (!this.video) {
      return;
    }
    this.video.currentTime = second;
  }

  gotFrame() {
    if (!this.canvas) {
      return;
    }
    this.context = this.canvas.getContext('2d');
    if (!this.context) {
      return;
    }
    if (!this.video) {
      return;
    }
    this.context.drawImage(this.video, 0, 0, 192, 108);
    this.imageOut.emit({
      uid: this.uid,
      video: this.video,
    });
  }

  async configureVideo(theUrl: string) {
    if (this.currentUrl == theUrl) {
      return;
    }
    // TODO borrar esiguiente línea
    //theUrl = 'assets/video/somevideo.mp4';
    const isFakeUrl = theUrl.startsWith('blob:');
    this.currentUrl = theUrl;

    if (isFakeUrl) {
      this.oldObjectUrl = this.currentUrl;
    } else {
      const publicUrl = MyConstants.getPublicUrl(theUrl, false);
      const object: any = await this.httpSrv.get(publicUrl, {
        isBlob: true,
        useCache: true,
      });
      if (this.oldObjectUrl != null) {
        URL.revokeObjectURL(this.oldObjectUrl);
        this.oldObjectUrl = null;
      }

      this.oldObjectUrl = URL.createObjectURL(object);
    }

    this.previousUrl = this.sanitizer.bypassSecurityTrustUrl(this.oldObjectUrl);

    if (this.videoRef) {
      this.video = this.videoRef.nativeElement;
      if (this.video instanceof HTMLVideoElement) {
        this.video.addEventListener('seeked', this.gotFrame.bind(this));
        this.imageOut.emit({
          uid: this.uid,
          video: this.video,
        });
        this.goToFrame(this.timeSeconds);
      } else {
        console.error(`Is not HTMLVideoElement`);
      }
    } else {
      console.error(`Is not HTMLVideoElement`);
    }
  }

  ngAfterViewInit() { }

  async ngOnInit(): Promise<void> { }
}
