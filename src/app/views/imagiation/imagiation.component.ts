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
import { BaseComponent } from 'ejflab-front-lib';
import { ActivatedRoute } from '@angular/router';
import { BackendPageService } from 'ejflab-front-lib';
import { AuthService } from 'ejflab-front-lib';
import { MatDialog } from '@angular/material/dialog';
import { TupleService } from 'ejflab-front-lib';
import { FileResponseData, FileService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { WebcamService } from 'ejflab-front-lib';
import { LoginService } from 'ejflab-front-lib';
import { HttpService } from 'ejflab-front-lib';
import { OptionData } from 'ejflab-front-lib';
import { MyDatesFront } from '@ejfdelgado/ejflab-common/src/MyDatesFront';
import {
  ImageiationService,
  ImagiationData,
  ImagiationDataQuery,
} from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { FlowchartService } from 'ejflab-front-lib';
import { CallService } from 'ejflab-front-lib';

export interface TheStateViewData {
  openedFloatingMenu: boolean;
  fullScreen: boolean;
  seeCalibPoints: boolean;
  selectedDot: string | null;
  currentPlayTime: number;
  menuTop: {
    dragging: boolean;
    right: number;
    bottom: number;
    startx: number;
    starty: number;
    oldBottom: number;
    oldRight: number;
  };
}

export async function processFile(
  pageId: string,
  responseData: FileResponseData,
  fileService: FileService,
  imagiationSrv: ImageiationService,
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
      const databaseEntry: ImagiationData = await imagiationSrv.savePhoto({
        pg: pageId,
        tags: [],
        tagCount: 0,
        tagList: [],
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
  selector: 'app-imagiation',
  templateUrl: './imagiation.component.html',
  styleUrls: ['./imagiation.component.css'],
})
export class ImagiationComponent
  extends BaseComponent
  implements OnInit, OnChanges
{
  public currentView: string = 'tag';
  public mymodel: any = {};
  public extraOptions: Array<OptionData> = [];
  public states: TheStateViewData = {
    openedFloatingMenu: false,
    fullScreen: false,
    seeCalibPoints: false,
    selectedDot: null,
    currentPlayTime: 0,
    menuTop: {
      dragging: false,
      right: 0,
      bottom: 0,
      startx: 0,
      starty: 0,
      oldBottom: 10,
      oldRight: 10,
    },
  };
  public bussyState: { [key: string]: boolean } = {
    imageBussy: false,
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
    private readonly httpSrv: HttpService
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

    // Se lee el mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode) {
      this.currentView = mode;
    }

    const VIEW_OPTIONS = [
      { name: 'tag', label: 'Imágenes', icon: 'image' },
      { name: 'jobgallery', label: 'Entrenamientos', icon: 'psychology' },
      { name: 'play', label: 'Ejecuciónes', icon: 'play_arrow' },
      { name: 'statistics', label: 'Estadísticas', icon: 'query_stats' },
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

    const html = document.getElementsByTagName('html');
    if (html.length > 0) {
      html[0].style = 'overflow: hidden;';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {}

  bindEvents() {}

  override async ngOnInit() {
    await super.ngOnInit();
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

  getSaveState() {
    if (this.saveState != 'done') {
      return 'processing';
    }
    const llaves = Object.keys(this.bussyState);
    for (let i = 0; i < llaves.length; i++) {
      if (this.bussyState[llaves[i]]) {
        return 'processing';
      }
    }
    return 'done';
  }
}
