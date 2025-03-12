import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
//import { PageData } from 'src/interfaces/login-data.interface';
//import { FileResponseData, FileService } from 'src/services/file.service';
//import { FileRequestData } from 'src/services/fileInterface';
//import { Img2MeshService } from 'src/services/img2mesh.service';
import { processFile } from '../../img2mesh.component';
import { FileRequestData, FileResponseData, FileService, PageData } from 'ejflab-front-lib';
import { Img2MeshService } from '../../services/img2mesh.service';

@Component({
  selector: 'app-autophoto',
  templateUrl: './autophoto.component.html',
  styleUrls: ['./autophoto.component.css'],
})
export class AutophotoComponent implements OnInit, AfterViewInit {
  @Input() page: PageData | null = null;
  constructor(
    public fileService: FileService,
    private img2meshSrv: Img2MeshService
  ) { }

  ngAfterViewInit(): void {
    this.askForImage();
  }

  ngOnInit(): void { }

  async processFile(responseData: FileResponseData) {
    if (this.page?.id) {
      await processFile(
        this.page.id,
        responseData,
        this.fileService,
        this.img2meshSrv
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
