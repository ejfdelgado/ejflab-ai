import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import md5 from 'md5';
import { Auth } from '@angular/fire/auth';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { MyDatesFront } from '@ejfdelgado/ejflab-common/src/MyDatesFront';

import { QrcaptureComponent } from '../imagiation/components/qrcapture/qrcapture.component';
import { FilterimageComponent } from '../imagiation/components/filterimage/filterimage.component';
import { AuthService, BackendPageService, BaseComponent, CallService, FileRequestData, FileResponseData, FileService, FlowchartService, HttpService, ImagiationDataQuery, LoginService, ModalService, OptionData, TupleService, WebcamService } from 'ejflab-front-lib';
import { Img2MeshData, Img2MeshService } from './services/img2mesh.service';

export interface ImageShoot {
  id?: string;
  created?: number;
  updated?: number;
  author?: string;
  pg: string;
  urlBig: string;
  urlThumbnail: string;
}

export interface LocalModelData {
  imagegallery: { [key: string]: ImageShoot };
}

export async function processFile(
  pageId: string,
  responseData: FileResponseData,
  fileService: FileService,
  img2meshSrv: Img2MeshService,
  addImageToArray?: Function
) {
  const funSingleImage = async (base64: string) => {
    const seedSize = 32;
    const seed = base64.substring(base64.length - seedSize, seedSize);
    const response = await fileService.save({
      base64,
      fileName: `${MyDatesFront.getDayAsContinuosNumberHmmSSmmm(
        new Date()
      )}-${md5(seed)}.jpg`,
      isPublic: false,
      isImage: true,
    });

    if (pageId) {
      const databaseEntry: Img2MeshData = await img2meshSrv.savePhoto({
        pg: pageId,
        urlBig: response.key,
        urlThumbnail: MyConstants.getSuffixPath(response.key, '_xs'),
      });
      if (addImageToArray) {
        if (databaseEntry.image instanceof Array) {
          for (let j = 0; j < databaseEntry.image.length; j++) {
            const image1 = databaseEntry.image[j];
            addImageToArray(image1);
          }
        } else {
          addImageToArray(databaseEntry.image);
        }
      }
    }
  };

  if (responseData.base64 instanceof Array) {
    const lista = responseData.base64;
    for (let i = 0; i < lista.length; i++) {
      const elem = lista[i];
      await funSingleImage(elem);
    }
  } else {
    await funSingleImage(responseData.base64);
  }
}

@Component({
  selector: 'app-img2mesh',
  templateUrl: './img2mesh.component.html',
  styleUrls: ['./img2mesh.component.css'],
})
export class Img2meshComponent
  extends BaseComponent
  implements OnInit, OnChanges {
  public extraOptions: Array<OptionData> = [];
  public currentView: string = 'gallery';
  public mymodel: any = {};
  localmodel: LocalModelData = {
    imagegallery: {},
  };
  constructor(
    public override flowchartSrv: FlowchartService,
    public override callService: CallService,
    public override route: ActivatedRoute,
    public override pageService: BackendPageService,
    public override cdr: ChangeDetectorRef,
    public override authService: AuthService,
    public override dialog: MatDialog,
    public override tupleService: TupleService,
    public override fileService: FileService,
    public override modalService: ModalService,
    public override webcamService: WebcamService,
    public override auth: Auth,
    public loginSrv: LoginService,
    @Inject(DOCUMENT) private document: any,
    private readonly httpSrv: HttpService,
    private readonly img2meshSrv: Img2MeshService
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

    const VIEW_OPTIONS = [
      { name: 'gallery', label: 'Imágenes', icon: 'image' },
      { name: 'jobgallery', label: 'Procesamientos', icon: 'psychology' },
    ];
    for (let i = 0; i < VIEW_OPTIONS.length; i++) {
      const viewOption = VIEW_OPTIONS[i];
      this.extraOptions.push({
        action: () => {
          this.setView(viewOption.name);
        },
        icon: viewOption.icon,
        label: viewOption.label,
      });
    }

    this.extraOptions.push({
      action: () => {
        // Delete cookie
        document.cookie = 'yo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        // Reload
        location.reload();
      },
      icon: 'fingerprint',
      label: 'Refrescar credenciales',
    });
  }

  ngOnChanges(changes: SimpleChanges): void { }

  bindEvents() { }

  override async ngOnInit() {
    await super.ngOnInit();
    this.readQueryparams();
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = user;
        this.loadMorePhotos();
      } else {
        this.localmodel.imagegallery = {};
      }
    });
    this.pageService.evento.subscribe((page: any) => {
      this.page = page;
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      if (mode) {
        this.currentView = mode;
      }
      this.loadMorePhotos();
    });
  }

  setView(viewName: string) {
    this.currentView = viewName;
  }

  getSelf() {
    return this;
  }

  async saveAll() {
    this.saveTuple();
  }

  override onTupleNews() {
    this.mymodel = this.tupleModel.data;
    this.completeDefaults();
    super.onTupleNews();
  }

  completeDefaults() {
    this.mymodel = Object.assign(
      {
        predefinido: true,
      },
      this.mymodel
    );
  }

  async processFile(responseData: FileResponseData) {
    if (this.page?.id) {
      const addImageToArrayThis = this.addImageToArray.bind(this);
      processFile(
        this.page.id,
        responseData,
        this.fileService,
        this.img2meshSrv,
        addImageToArrayThis
      );
    }
  }

  async askForImage() {
    // fileimage fileimage-photo photo
    if (this.page?.id) {
      const options: FileRequestData = {
        type: 'fileimage-photo',
        defaultFileName: 'temporal.jpg',
      };
      const processFileThis = this.processFile.bind(this);
      this.fileService.sendRequest(options, processFileThis);
    }
  }

  async takePhoto() {
    await this.askForImage();
  }

  getUIDFromImage(image: ImageShoot) {
    const urlBig = image.urlBig;
    const tokens = /\/([^\/]*).jpg/.exec(urlBig);
    if (tokens) {
      const key = tokens[1];
      return key;
    }
    return null;
  }

  addImageToArray(image: ImageShoot) {
    const key = this.getUIDFromImage(image);
    if (key) {
      this.localmodel.imagegallery[key] = image;
    }
  }

  async openTakePhotoPopUp() {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(QrcaptureComponent, {
      data: {
        pageId: this.page.id,
        pageType: 'img2mesh',
      },
      panelClass: 'edit-user-dialog-container',
    });
  }

  async openFilterPopUp() {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(FilterimageComponent, {
      data: {
        pageId: this.page.id,
        pageType: 'img2mesh',
        filter: this.querySearchParams,
      },
      panelClass: 'edit-user-dialog-container',
    });
    const response = await new Promise<ImagiationDataQuery | null | undefined>(
      (resolve) => {
        dialogRef.afterClosed().subscribe((result) => {
          resolve(result);
        });
      }
    );
    if (response) {
      this.querySearchParams = response;
      // Reset loaded images and ask again
      this.localmodel.imagegallery = {};
      this.loadMorePhotos();
    }
  }

  async loadMorePhotos() {
    if (this.page?.id) {
      const pageId: string = this.page.id;
      const loadedCount = Object.keys(this.localmodel.imagegallery).length;
      if (
        this.querySearchParams.max_count > 0 &&
        loadedCount >= this.querySearchParams.max_count
      ) {
        return 0;
      }
      this.querySearchParams.offset =
        this.querySearchParams.min_offset + loadedCount;
      const response = await this.img2meshSrv.pagePhotos(
        pageId,
        this.querySearchParams
      );
      const images = response.images;
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (
          this.querySearchParams.max_count == 0 ||
          loadedCount + i < this.querySearchParams.max_count
        ) {
          this.addImageToArray(image);
        } else {
          break;
        }
      }
      return images.length;
    }
    return 0;
  }

  async reloadImages() {
    this.localmodel.imagegallery = {};
    await this.loadMorePhotos();
  }

  async editPhoto(person: ImageShoot) {
    // Open dialog
  }

  async erasePhoto(person: ImageShoot) {
    const decision = await this.modalService.confirm({
      title: `¿Seguro?`,
      txt: `Esta acción no se puede deshacer`,
    });
    if (!decision) {
      return;
    }
    try {
      await this.img2meshSrv.deletePhotos(person);
      // Remove it from the list
      if (person) {
        const key = this.getUIDFromImage(person);
        if (key) {
          delete this.localmodel.imagegallery[key];
        }
      }
    } catch (err) { }
  }
}
