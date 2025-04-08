import { Component, HostListener, OnInit } from '@angular/core';
import { AuthorizationGetData, FileBase64Data, FlowchartProcessRequestData, FlowchartService, HttpService, ImagepickerOptionsData } from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-ocr',
  templateUrl: './ocr.component.html',
  styleUrls: [
    './ocr.component.css'
  ]
})
export class OcrComponent implements OnInit {
  formRight: FormGroup;
  currentSearchImage: string = MyConstants.PAGE.DEFAULT_IMAGE;
  currentSearchBlob: Blob | null = null;
  imageOptions: ImagepickerOptionsData = {
    isEditable: true,
    isRounded: false,
    useBackground: true,
    defaultImage: MyConstants.PAGE.DEFAULT_IMAGE,
    imageStyle: {
      'max-height': '200px',
    },
  };

  constructor(
    public httpSrv: HttpService,
    public flowchartSrv: FlowchartService,
    public fb: FormBuilder,
  ) {

  }

  ngOnInit(): void {
    this.formRight = this.fb.group({
      text: ['', []],
    });
  }

  freeOldImage() {
    if (this.currentSearchImage) {
      try {
        URL.revokeObjectURL(this.currentSearchImage);
      } catch (err) { }
    }
  }

  async changedImage(imagenBase64: FileBase64Data) {
    if (imagenBase64.base64) {
      this.currentSearchBlob = await this.httpSrv.b64toBlob(
        imagenBase64.base64
      );
      this.freeOldImage();
      this.currentSearchImage = URL.createObjectURL(this.currentSearchBlob);
    }
  }

  async getImageFromClipBoard() {
    const blob: Blob | null = await this.getClipboardImageBlob();
    if (blob) {
      this.currentSearchBlob = blob;
      this.freeOldImage();
      this.currentSearchImage = URL.createObjectURL(blob);
    }
  }

  getPageImage(): string | null {
    return this.currentSearchImage;
  }

  async recognize() {
    const buffer = await this.currentSearchBlob?.arrayBuffer();
    if (buffer) {
      const uint8Array = new Uint8Array(buffer);
      const payload: FlowchartProcessRequestData = {
        loadingIndicator: true,
        channel: 'post',
        processorMethod: 'ocr.get_text',
        room: 'processors',
        namedInputs: {
          bytes: uint8Array,
        },
        data: {

        },
      };
      const response = await this.flowchartSrv.process(payload, false);

      this.formRight.get("text")?.setValue(response.response.data.text);
    }
  }

  async getClipboardImageBlob() {
    try {
      // Step 1: Read clipboard items
      const clipboardItems = await navigator.clipboard.read();

      // Step 2: Loop through clipboard items to find an image
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            // Step 3: Convert clipboard item to Blob
            const blob = await item.getType(type);
            return blob;
          }
        }
      }
      console.log("No image found in clipboard.");
      return null;
    } catch (error) {
      console.error("Failed to get clipboard image:", error);
      return null;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey) {
      switch (event.code) {
        case 'KeyV':
          this.getImageFromClipBoard();
          break;
        default:
        //console.log(event.code);
      }
    }
  }
}
