import { Component } from '@angular/core';
import { AuthorizationGetData, FileBase64Data, FlowchartProcessRequestData, FlowchartService, HttpService, ImagepickerOptionsData } from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';

@Component({
  selector: 'app-ocr',
  templateUrl: './ocr.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../containers.css',
    '../../../../fonts.css',
    '../../../../forms.css',
    './ocr.component.css'
  ]
})
export class OcrComponent {
  text: string = "";
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
  ) {

  }

  async changedImage(imagenBase64: FileBase64Data) {
    if (imagenBase64.base64) {
      this.currentSearchBlob = await this.httpSrv.b64toBlob(
        imagenBase64.base64
      );
      this.currentSearchImage = URL.createObjectURL(this.currentSearchBlob);
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

      this.text = response.response.data.text;
    }
  }
}
