import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { PageData } from 'ejflab-front-lib';
import {
  FileResponseData,
  FileService,
} from 'ejflab-front-lib';
import { FileRequestData } from 'ejflab-front-lib';
import { ImageiationService } from 'ejflab-front-lib';
import { processFile } from '../../imagiation.component';

@Component({
  selector: 'app-autophoto',
  templateUrl: './autophoto.component.html',
  styleUrls: ['./autophoto.component.css'],
})
export class AutophotoComponent implements OnInit, AfterViewInit {
  @Input() page: PageData | null = null;
  constructor(
    public fileService: FileService,
    private imagiationSrv: ImageiationService
  ) {}

  ngAfterViewInit(): void {
    this.askForImage();
  }

  ngOnInit(): void {}

  async processFile(responseData: FileResponseData) {
    if (this.page?.id) {
      await processFile(
        this.page.id,
        responseData,
        this.fileService,
        this.imagiationSrv
      );
      this.askForImage();
    }
  }

  async askForImage() {
    // fileimage fileimage-photo photo
    if (this.page?.id) {
      const options: FileRequestData = {
        type: 'photo',
        defaultFileName: 'temporal.jpg',
      };
      const processFileThis = this.processFile.bind(this);
      this.fileService.sendRequest(options, processFileThis);
    }
  }
}
