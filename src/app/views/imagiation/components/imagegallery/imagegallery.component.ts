import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MyDatesFront } from '@ejfdelgado/ejflab-common/src/MyDatesFront';
import { MatDialog } from '@angular/material/dialog';
import {
  FileResponseData,
  FileService,
} from 'ejflab-front-lib';
import { FileRequestData } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { processFile } from '../../imagiation.component';
import { ClassgalleryComponent } from '../classgallery/classgallery.component';
import {
  ImageiationService,
  ImagiationDataQuery,
  TheTagData,
  ImageShoot,
} from 'ejflab-front-lib';
import { Auth } from '@angular/fire/auth';
import { FilterimageComponent } from '../filterimage/filterimage.component';
import { MyColor } from '@ejfdelgado/ejflab-common/src/MyColor';
import { QrcaptureComponent } from '../qrcapture/qrcapture.component';
import { debounce } from '@ejfdelgado/ejflab-common/src/MyThrottle';
import { IndicatorService } from 'ejflab-front-lib';
import { DefinehelpermodelComponent } from '../definehelpermodel/definehelpermodel.component';
import {
  ImagedetectionService,
  ImageSimpleDetData,
} from 'ejflab-front-lib';
import { PageData } from 'ejflab-front-lib';

export interface BoundingBoxHelper {
  style: {
    width: string;
    height: string;
  };
  styleImage: { marginTop: string; marginLeft: string };
  styleOverlay: { left: string; top: string; width: string; height: string };
  styleBBoxNew: {
    borderColor: string;
    display: string;
    left: string;
    top: string;
    width: string;
    height: string;
  };
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
}

export interface TagContainer {
  bbox: {
    label: number;
    theclass: string;
    size: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  style: {
    content: string;
    borderColor: string;
    borderStyle: string;
    left: string;
    top: string;
    width: string;
    height: string;
  };
}

export interface XYCoordinate {
  x: number;
  y: number;
}

export interface MouseDrag {
  start: XYCoordinate | null;
  current: XYCoordinate | null;
}

export interface LocalModelData {
  imagegallery: { [key: string]: ImageShoot };
  tags: TheTagData;
}

@Component({
  selector: 'app-imagegallery',
  templateUrl: './imagegallery.component.html',
  styleUrls: ['./imagegallery.component.css'],
})
export class ImagegalleryComponent implements OnInit {
  @Input() page: PageData | null = null;
  @Input() bussyState: { [key: string]: boolean };
  @ViewChild('container_preview') containerPreview: ElementRef;
  @ViewChild('container_gallery') containerGallery: ElementRef;
  @ViewChild('big_image_ref') bigImageRef: ElementRef;
  @ViewChild('container_overlay') containerOverlay: ElementRef;

  localmodel: LocalModelData = {
    imagegallery: {},
    tags: {},
  };
  mouseDrag: MouseDrag = { start: null, current: null };
  currentImage: ImageShoot | null = null;
  changedImages: Array<ImageShoot> = [];
  currentView: string = 'thumbnails';
  currentTags: Array<TagContainer> = [];
  currentLabel: string | null = null;
  showTags: boolean = false;
  mouseOverImage: boolean = false;
  mouseOverImageParent: boolean = false;
  boundingBoxBigImage: BoundingBoxHelper = {
    imageWidth: 0,
    imageHeight: 0,
    height: 0,
    width: 0,
    style: { height: '0px', width: '0px' },
    styleImage: { marginTop: '0px', marginLeft: '0px' },
    styleOverlay: { left: '0px', top: '0px', width: '0px', height: '0px' },
    styleBBoxNew: {
      borderColor: '#000000',
      display: 'none',
      left: '0px',
      top: '0px',
      width: '0px',
      height: '0px',
    },
  };
  viewAdjusted: boolean = false;
  adjustIteration: number = 0;
  bindOverlayEventsThis: Function;
  bindOverlayParentEventsThis: Function;
  saveDebouncedHandler: Function;
  queryPhotos: ImagiationDataQuery = {
    max: 10,
    min_offset: 0,
    offset: 0,
    max_date: 0,
    min_date: 0,
    max_count: 0,
  };
  helperModelId: string | null = null;
  tapedTwice: boolean = true;

  constructor(
    public fileService: FileService,
    private modalSrv: ModalService,
    public dialog: MatDialog,
    private imagiationSrv: ImageiationService,
    private auth: Auth,
    public cdr: ChangeDetectorRef,
    private indicatorSrv: IndicatorService,
    public imageDetectionSrv: ImagedetectionService
  ) {
    this.bindOverlayEventsThis = this.bindOverlayEvents.bind(this);
    this.bindOverlayParentEventsThis = this.bindOverlayParentEvents.bind(this);
    this.saveDebouncedHandler = debounce(this.trySaveChanges.bind(this), 2000);
    const oldHelperModelId = localStorage.getItem('helperModelId');
    if (oldHelperModelId) {
      this.helperModelId = oldHelperModelId;
    }
  }

  @HostListener('document:keypress', ['$event'])
  async handleKeyboardEvent(event: KeyboardEvent) {
    if (this.mouseOverImageParent) {
      if (event.code == 'KeyA') {
        // Previous image
        this.iterateImages(false);
        return;
      } else if (event.code == 'KeyD') {
        // Next image
        this.iterateImages(true);
        return;
      } else if (event.code == 'KeyW') {
        // previous tag
        this.iterateTags(true);
        return;
      } else if (event.code == 'KeyS') {
        // Next tag
        this.iterateTags(false);
        return;
      } else if (event.code == 'KeyR') {
        // Reload images
        this.reloadImages();
        return;
      } else if (event.code == 'KeyZ') {
        // Reload images
        this.autoLabel();
        return;
      }
      //console.log(event);
      const selectedTag = this.getSelectedTag();
      if (selectedTag) {
        if (event.code == 'KeyX') {
          // Delete tag
          const responseConfirm = await this.modalSrv.confirm({
            title: `¿Borrar etiqueta de "${selectedTag.bbox.theclass}"?`,
            txt: 'Esta acción no se puede deshacer.',
          });
          if (!responseConfirm) {
            return;
          }
          // Removeit and recompute
          const index = this.currentTags.indexOf(selectedTag);
          if (index >= 0) {
            const tags = this.currentImage?.tags;
            if (tags) {
              tags.splice(index, 1);
              this.setChangedImage(this.currentImage);
              this.recomputeCurrentImageTags();
            }
          }
        } else if (event.code == 'KeyC') {
          // Change class ot current tag
          this.openClassPopUp(selectedTag);
        }
      } else {
        if (event.code == 'KeyX') {
          this.eraseImage();
        } else if (event.code == 'KeyC') {
          this.openClassPopUp();
        }
      }
    }
  }

  ngOnInit(): void {
    this.readQueryparams();
    setTimeout(() => {
      this.onResize({});
    }, 0);
    // Solo al tener usuario logeado se muestran las fotos
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.loadMorePhotos();
        this.loadTags();
      } else {
        this.localmodel.imagegallery = {};
      }
    });
  }

  readQueryParam(
    urlParams: URLSearchParams,
    name: string,
    type: string,
    defValue: any
  ) {
    let val = defValue;
    const raw = urlParams.get(name);
    if (type == 'number') {
      if (raw != null) {
        val = parseInt(raw);
        if (isNaN(val)) {
          val = defValue;
        }
      }
    } else {
      val = raw;
    }
    return val;
  }

  async iterateImages(forward: boolean) {
    // Debo saber cuál es la imagen actual, si no hay usar la primera
    // Tomar la lista de imagenes y actualizar this.currentImage
    // Si llega al final, debe pedir al servidor más imágenes
    // Si llegan más imágenes tomar la siguiente
    const computeOrdered = () => {
      return Object.keys(this.localmodel.imagegallery)
        .map((value) => {
          return this.localmodel.imagegallery[value];
        })
        .sort((a: ImageShoot, b: ImageShoot) => {
          if (a.created && b.created) {
            return b.created - a.created;
          }
          return 0;
        });
    };
    let ordered = computeOrdered();
    const tamanio = ordered.length;
    if (tamanio == 0) {
      return;
    }
    if (!this.currentImage) {
      this.currentImage = ordered[0];
    } else {
      const currentImage = this.currentImage;
      let index = ordered.indexOf(currentImage);
      if (index >= 0) {
        if (forward) {
          index += 1;
          if (index >= tamanio) {
            const loaded = await this.loadMorePhotos();
            if (loaded > 0) {
              // Se debe recalcular las ordenadas
              ordered = computeOrdered();
              this.currentImage = ordered[index];
            } else {
              this.currentImage = ordered[0];
            }
          } else {
            this.currentImage = ordered[index];
          }
        } else {
          // backward
          index -= 1;
          if (index < 0) {
            this.currentImage = ordered[tamanio - 1];
          } else {
            this.currentImage = ordered[index];
          }
        }
      } else {
        this.currentImage = ordered[0];
      }
    }
    this.setCurrentImage(this.currentImage);
    this.cdr.detectChanges();
  }

  async reloadImages() {
    this.localmodel.imagegallery = {};
    await this.loadMorePhotos();
    this.currentImage = null;
  }

  iterateTags(forward: boolean) {
    //console.log(`iterateTags ${forward}`);
    // Debo saber cuál es el tag actual, si no hay usar el primero
    // Tomar la lista de tags y actualizar this.currentLabel
    // Si llega al final, vuelve a la primera
    // La anterior de la primera, es la última
    const ordered = Object.keys(this.localmodel.tags)
      .map((value) => {
        return parseInt(value);
      })
      .sort();
    const tamanio = ordered.length;
    if (tamanio == 0) {
      return;
    }
    if (!this.currentLabel) {
      this.currentLabel = `${ordered[0]}`;
    } else {
      const currentLabel = parseInt(this.currentLabel);
      let index = ordered.indexOf(currentLabel);
      if (index >= 0) {
        if (forward) {
          index += 1;
          if (index >= tamanio) {
            this.currentLabel = `${ordered[0]}`;
          } else {
            this.currentLabel = `${ordered[index]}`;
          }
        } else {
          // backward
          index -= 1;
          if (index < 0) {
            this.currentLabel = `${ordered[tamanio - 1]}`;
          } else {
            this.currentLabel = `${ordered[index]}`;
          }
        }
      } else {
        this.currentLabel = `${ordered[0]}`;
      }
    }
    this.cdr.detectChanges();
  }

  getPhotoCreatedDate(image: ImageShoot) {
    if (image.created) {
      return MyDatesFront.formatDateCompleto(new Date(image.created));
    } else {
      return '';
    }
  }

  readQueryparams() {
    const urlParams = new URLSearchParams(window.location.search);
    this.queryPhotos.min_offset = this.readQueryParam(
      urlParams,
      'min_offset',
      'number',
      0
    );
    this.queryPhotos.max_count = this.readQueryParam(
      urlParams,
      'max_count',
      'number',
      0
    );
    this.queryPhotos.max = this.readQueryParam(urlParams, 'max', 'number', 10);
    const max_date = this.readQueryParam(urlParams, 'max_date', 'number', 0);
    if (max_date > 0) {
      this.queryPhotos.max_date = MyDatesFront.AAAAMMDDhhmmss2unixUTC(max_date);
    }
    const min_date = this.readQueryParam(urlParams, 'min_date', 'number', 0);
    if (min_date > 0) {
      this.queryPhotos.min_date = MyDatesFront.AAAAMMDDhhmmss2unixUTC(min_date);
    }
  }

  async loadTags() {
    if (this.page?.id) {
      const pageId: string = this.page.id;
      const response = await this.imagiationSrv.tagsRead(pageId);
      this.localmodel.tags = response.tag;
    }
  }

  async loadMorePhotos() {
    if (this.page?.id) {
      const pageId: string = this.page.id;
      const loadedCount = Object.keys(this.localmodel.imagegallery).length;
      if (
        this.queryPhotos.max_count > 0 &&
        loadedCount >= this.queryPhotos.max_count
      ) {
        return 0;
      }
      this.queryPhotos.offset = this.queryPhotos.min_offset + loadedCount;
      const response = await this.imagiationSrv.pagePhotos(
        pageId,
        this.queryPhotos
      );
      const images = response.images;
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (
          this.queryPhotos.max_count == 0 ||
          loadedCount + i < this.queryPhotos.max_count
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

  getUIDFromImage(image: ImageShoot) {
    return image.id;
  }

  addImageToArray(image: ImageShoot) {
    const key = this.getUIDFromImage(image);
    if (key) {
      this.localmodel.imagegallery[key] = image;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.adjustView();
  }

  completeImagePath(path: string) {
    return MyConstants.SRV_ROOT + path + '?authcookie=1&max_age=604800';
  }

  getImgKeyHelper() {
    return MyConstants.SRV_ROOT + 'assets/img/teclas.png';
  }

  async eraseImage() {
    const currentImage = this.currentImage;
    if (!currentImage) {
      return;
    }
    try {
      const responseConfirm = await this.modalSrv.confirm({
        title: `¿Borrar foto actual?`,
        txt: 'Esta acción no se puede deshacer.',
      });
      if (!responseConfirm) {
        return;
      }
      if (currentImage) {
        await this.imagiationSrv.deletePhotos(currentImage);
        const promesas: Array<Promise<any>> = [];
        if (currentImage.urlThumbnail) {
          promesas.push(this.fileService.delete(currentImage.urlThumbnail));
        }
        if (currentImage.urlBig) {
          promesas.push(this.fileService.delete(currentImage.urlBig));
        }
        await Promise.all(promesas);
        // Remove it from array and from pending to save
        const changedIndex = this.changedImages.indexOf(currentImage);
        if (changedIndex >= 0) {
          this.changedImages.splice(changedIndex, 1);
        }
        const uid = this.getUIDFromImage(currentImage);
        const imagegallery = this.localmodel.imagegallery;
        if (uid) {
          delete imagegallery[uid];
        }

        if (this.currentImage) {
          const created: any = this.currentImage.created;
          //console.log(`created = ${created}`);
          let menorMayor: any = null;
          let menorMayorId: any = null;
          let mayorMenor: any = null;
          let mayorMenorId: any = null;
          const llaves = Object.keys(imagegallery);
          for (let i = 0; i < llaves.length; i++) {
            const llave = llaves[i];
            const unaImagen: any = imagegallery[llave];
            //console.log(`unaImagen.created = ${unaImagen.created}`);
            if (unaImagen.created < created) {
              if (menorMayor == null || unaImagen.created > menorMayor) {
                menorMayor = unaImagen.created;
                menorMayorId = unaImagen.id;
              }
            }
            if (unaImagen.created > created) {
              if (mayorMenor == null || unaImagen.created < mayorMenor) {
                mayorMenor = unaImagen.created;
                mayorMenorId = unaImagen.id;
              }
            }
            //console.log(`menorMayorId = ${menorMayorId}`);
            //console.log(`mayorMenorId = ${mayorMenorId}`);
          }
          if (menorMayorId) {
            // Se prefiere quedarse con el mas antiguo, osea el menor
            this.currentImage = imagegallery[menorMayorId];
          } else if (mayorMenorId) {
            this.currentImage = imagegallery[mayorMenorId];
          } else {
            this.currentImage = null;
          }
        }
      }
    } catch (err) {}
  }

  getPhotoDetail(image: ImageShoot) {
    if (image.tagCount) {
      return `x ${image.tagCount}`;
    } else {
      return '-';
    }
  }

  setChangedImage(image: ImageShoot | undefined | null) {
    if (!image) {
      return;
    }
    if (this.changedImages.indexOf(image) < 0) {
      this.changedImages.push(image);
    }
    this.saveChangedImages();
    // Recompute extra data
    const tags = image.tags;
    image.tagCount = 0;
    image.tagList = [];
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const label = tag[0];
      if (image.tagList.indexOf(label) < 0) {
        image.tagList.push(label);
        image.tagCount++;
      }
    }
  }

  async trySaveChanges() {
    try {
      this.bussyState['imageBussy'] = true;
      await this.imagiationSrv.savePhoto(this.changedImages);
      this.changedImages = [];
    } finally {
      this.bussyState['imageBussy'] = false;
    }
  }

  async saveChangedImages() {
    if (this.changedImages.length > 0) {
      this.bussyState['imageBussy'] = true;
      this.saveDebouncedHandler();
    } else {
      this.bussyState['imageBussy'] = false;
    }
  }

  async processFile(responseData: FileResponseData) {
    if (this.page?.id) {
      const addImageToArrayThis = this.addImageToArray.bind(this);
      processFile(
        this.page.id,
        responseData,
        this.fileService,
        this.imagiationSrv,
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

  setView(viewName: string) {
    this.currentView = viewName;
    setTimeout(() => {
      this.onResize({});
    }, 0);
  }

  setCurrentImage(image: ImageShoot) {
    this.currentImage = image;
    setTimeout(() => {
      this.onResize({});
    }, 0);
  }

  private getGlobalOffset(el: HTMLElement) {
    let x = 0;
    let y = 0;
    x += el.offsetLeft;
    y += el.offsetTop;
    if (el.offsetParent) {
      const response = this.getGlobalOffset(el.offsetParent as HTMLElement);
      x += response.x;
      y += response.y;
    }
    return {
      x,
      y,
    };
  }

  private getCoordinatesFromEvent(e: MouseEvent | TouchEvent) {
    const source = e.target || e.srcElement;
    const touchEvent = e as TouchEvent;
    const mouseEvent = e as MouseEvent;
    let mouseX = touchEvent.changedTouches
      ? touchEvent.changedTouches[0].pageX
      : mouseEvent.pageX;
    let mouseY = touchEvent.changedTouches
      ? touchEvent.changedTouches[0].pageY
      : mouseEvent.pageY;
    if (source) {
      const el = source as HTMLElement;
      const response = this.getGlobalOffset(el);
      if (response.x !== null) {
        mouseX -= response.x;
      }
      if (response.y !== null) {
        mouseY -= response.y;
      }
    }
    return {
      mouseX,
      mouseY,
    };
  }

  private pressEventHandler = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    //const mySvgContainerRef = this.mySvgContainerRef?.nativeElement;
    const { mouseX, mouseY } = this.getCoordinatesFromEvent(e);
    this.mouseDrag.start = {
      x: mouseX,
      y: mouseY,
    };

    // algo...
    if (this.tapedTwice) {
      this.tapedTwice = false;
      setTimeout(() => {
        this.tapedTwice = true;
      }, 300);
      return;
    }
    this.callDoubleTap({
      x: mouseX,
      y: mouseY,
    });
  };

  callDoubleTap(coordinates: any) {
    const smallestTag = this.rayTraceTag(coordinates.x, coordinates.y);
    if (smallestTag) {
      this.openClassPopUp(smallestTag);
    }
  }

  private dragEventHandlerParent = (e: MouseEvent | TouchEvent) => {
    this.mouseOverImageParent = true;
  };

  rayTraceTag(mouseX: number, mouseY: number) {
    let smallestTag: TagContainer | null = null;
    for (let i = 0; i < this.currentTags.length; i++) {
      const currentTag = this.currentTags[i];
      if (
        currentTag.bbox.left <= mouseX &&
        mouseX <= currentTag.bbox.right &&
        currentTag.bbox.top <= mouseY &&
        mouseY <= currentTag.bbox.bottom
      ) {
        if (smallestTag == null) {
          smallestTag = currentTag;
        } else {
          if (smallestTag.bbox.size > currentTag.bbox.size) {
            smallestTag = currentTag;
          }
        }
      }
      currentTag.style.borderStyle = 'solid';
    }
    // Solo se selecciona el de menor área
    if (smallestTag) {
      smallestTag.style.borderStyle = 'dashed';
    }
    return smallestTag;
  }

  private dragEventHandler = (e: MouseEvent | TouchEvent) => {
    this.mouseOverImage = true;
    this.mouseOverImageParent = true;
    e.preventDefault();
    const { mouseX, mouseY } = this.getCoordinatesFromEvent(e);
    if (this.mouseDrag.start == null) {
      // Just highlight and possible delete or change class
      const smallestTag = this.rayTraceTag(mouseX, mouseY);
      return;
    }

    this.mouseDrag.current = {
      x: mouseX,
      y: mouseY,
    };
    this.updateBBoxView();
  };

  getSelectedTag() {
    for (let i = 0; i < this.currentTags.length; i++) {
      const currentTag = this.currentTags[i];
      if (currentTag.style.borderStyle == 'dashed') {
        return currentTag;
      }
    }
    return null;
  }

  updateBBoxView() {
    const { status, minX, minY, width, height } = this.computeBBox();
    if (status) {
      this.boundingBoxBigImage.styleBBoxNew = {
        borderColor: this.getColorFromCurrentClass(),
        display: 'block',
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
    } else {
      this.boundingBoxBigImage.styleBBoxNew = {
        borderColor: this.getColorFromCurrentClass(),
        display: 'none',
        left: '0px',
        top: '0px',
        width: '0px',
        height: '0px',
      };
    }
  }

  computeBBox() {
    if (!this.mouseDrag.start || !this.mouseDrag.current) {
      return {
        status: false,
        minX: 0,
        minY: 0,
        width: 0,
        height: 0,
      };
    }
    let x1 = this.mouseDrag.start.x;
    let x2 = this.mouseDrag.current.x;
    let minX = Math.min(x1, x2);
    let maxX = Math.max(x1, x2);
    let width = maxX - minX;
    let y1 = this.mouseDrag.start.y;
    let y2 = this.mouseDrag.current.y;
    let minY = Math.min(y1, y2);
    let maxY = Math.max(y1, y2);
    let height = maxY - minY;
    return {
      status: true,
      minX,
      minY,
      width,
      height,
    };
  }

  private releaseEventHandler = (e: MouseEvent | TouchEvent) => {
    if (this.mouseDrag.start == null) {
      return;
    }
    // Create the bounding box in the
    if (this.currentImage && this.currentLabel != null) {
      const tags = this.currentImage.tags;
      const nuevoTag: Array<number> = [];
      const imageWidth = this.boundingBoxBigImage.imageWidth;
      const imageHeight = this.boundingBoxBigImage.imageHeight;
      const { status, minX, minY, width, height } = this.computeBBox();
      if (status && width >= 10 && height >= 10) {
        nuevoTag.push(parseInt(this.currentLabel));
        nuevoTag.push((minX + width / 2) / imageWidth); //x_center/width
        nuevoTag.push((minY + height / 2) / imageHeight); //y_center/height
        nuevoTag.push(width / imageWidth); //width/image_width
        nuevoTag.push(height / imageHeight); //height/image_height

        tags.push(nuevoTag);
        this.setChangedImage(this.currentImage);
        this.recomputeCurrentImageTags();
      }
    }

    this.mouseDrag.start = null;
    this.mouseDrag.current = null;
    this.updateBBoxView();
  };

  private cancelEventHandlerParent = (e: MouseEvent | TouchEvent) => {
    // Cancel bounding box
    this.mouseOverImageParent = false;
  };

  private cancelEventHandler = (e: MouseEvent | TouchEvent) => {
    // Cancel bounding box
    this.mouseOverImage = false;
    this.mouseDrag.start = null;
    this.mouseDrag.current = null;
    this.updateBBoxView();
  };

  bindOverlayEvents() {
    setTimeout(() => {
      const elementRef = this.containerOverlay.nativeElement;
      elementRef.addEventListener('mousedown', this.pressEventHandler);
      elementRef.addEventListener('mousemove', this.dragEventHandler);
      elementRef.addEventListener('mouseup', this.releaseEventHandler);
      elementRef.addEventListener('mouseout', this.cancelEventHandler);

      elementRef.addEventListener('touchstart', this.pressEventHandler);
      elementRef.addEventListener('touchmove', this.dragEventHandler);
      elementRef.addEventListener('touchend', this.releaseEventHandler);
      elementRef.addEventListener('touchcancel', this.cancelEventHandler);
    }, 0);
  }

  bindOverlayParentEvents() {
    setTimeout(() => {
      const parentRef = this.containerGallery.nativeElement;
      parentRef.addEventListener('mousemove', this.dragEventHandlerParent);
      parentRef.addEventListener('mouseout', this.cancelEventHandlerParent);
      parentRef.addEventListener('mouseover', this.dragEventHandlerParent);
    }, 0);
  }

  getColorFromClass(tabClass: number): string {
    return MyColor.int2colorhex(tabClass);
  }

  getColorFromCurrentClass(): string {
    return MyColor.int2colorhex(this.currentLabel);
  }

  getClassFromLabel(label: number) {
    const tags = this.localmodel.tags;
    const theclass = tags[`${label}`];
    return theclass.txt || '';
  }

  getCurrentClass() {
    const tags = this.localmodel.tags;
    if (this.currentLabel != null) {
      const theclass = tags[this.currentLabel];
      return theclass.txt;
    } else {
      return '';
    }
  }

  async openTakePhotoPopUp() {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(QrcaptureComponent, {
      data: {
        pageId: this.page.id,
        pageType: 'imagiation',
        pageMode: 'photo',
        title: 'Tomar fotografías',
        description: 'QR para toma de fotografías',
      },
      panelClass: 'edit-user-dialog-container',
    });
  }

  async autoLabel() {
    // Validar que hay imagen actual
    if (!this.currentImage || !this.viewAdjusted) {
      return;
    }
    // Hay imagen
    if (!this.helperModelId || this.helperModelId.trim().length == 0) {
      await this.openHelperPopUp(true);
    }
    if (!this.helperModelId) {
      return;
    }
    // Ya está listo para usar la imagen
    const source = this.bigImageRef.nativeElement;
    // Compute numClasses
    const tagsGlobales = this.localmodel.tags;
    const numClass = Object.keys(tagsGlobales).length;
    let detecciones: Array<ImageSimpleDetData> | null = null;

    detecciones = await this.imageDetectionSrv.detect(
      this.helperModelId,
      source,
      numClass,
      true,
      true
    );

    if (detecciones != null) {
      if (!this.currentImage.tags) {
        this.currentImage.tags = [];
      }
      const tagsImagen = this.currentImage.tags;
      const uniqueTags = this.getUniqueTags(tagsImagen);
      let added = 0;
      for (let j = 0; j < detecciones.length; j++) {
        const deteccion = detecciones[j];
        if (uniqueTags.indexOf(deteccion.tag) < 0) {
          const nuevoTag = [];
          nuevoTag.push(deteccion.tag);
          nuevoTag.push(deteccion.minX + deteccion.width / 2); //x_center/width
          nuevoTag.push(deteccion.minY + deteccion.height / 2); //y_center/height
          nuevoTag.push(deteccion.width); //width/image_width
          nuevoTag.push(deteccion.height); //height/image_height
          tagsImagen.push(nuevoTag);
          added++;
        }
      }
      console.log(`Added ${added} of ${detecciones.length}`);
      if (added > 0) {
        this.setChangedImage(this.currentImage);
        this.recomputeCurrentImageTags();
      }
    }
  }

  getUniqueTags(tags: Array<Array<number>>) {
    const tam = tags.length;
    const response: Array<number> = [];
    for (let i = 0; i < tam; i++) {
      const val = tags[i][0];
      if (response.indexOf(val) < 0) {
        response.push(val);
      }
    }
    return response;
  }

  async openHelperPopUp(useNow: boolean = false) {
    if (!this.page?.id) {
      return;
    }
    //console.log(`this.helperModelId = ${this.helperModelId}`);
    const dialogRef = this.dialog.open(DefinehelpermodelComponent, {
      data: {
        modelId: this.helperModelId,
      },
      panelClass: 'edit-user-dialog-container',
    });
    const response = await new Promise<any>((resolve) => {
      dialogRef.afterClosed().subscribe((result) => {
        resolve(result);
      });
    });
    if (response) {
      this.helperModelId = response.modelId;
      if (this.helperModelId) {
        localStorage.setItem('helperModelId', this.helperModelId);
      }
    }
    return this.helperModelId;
  }

  async openFilterPopUp() {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(FilterimageComponent, {
      data: {
        pageId: this.page.id,
        pageType: 'imagiation',
        filter: this.queryPhotos,
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
      this.queryPhotos = response;
      // Reset loaded images and ask again
      this.localmodel.imagegallery = {};
      this.loadMorePhotos();
    }
  }

  async openClassPopUp(tag?: TagContainer) {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(ClassgalleryComponent, {
      data: {
        pageId: this.page.id,
        tags: this.localmodel.tags,
        tag,
      },
      disableClose: true,
      panelClass: 'edit-user-dialog-container',
    });
    const response = await new Promise<any>((resolve) => {
      dialogRef.afterClosed().subscribe((result) => {
        resolve(result);
      });
    });
    if (response) {
      let recomputeTags = false;
      if (response.theclasses) {
        // Cambiaron las clases...
        this.localmodel.tags = response.theclasses;
        recomputeTags = true;
      }
      if (tag) {
        const indice = this.currentTags.indexOf(tag);
        const tags = this.currentImage?.tags;
        // Debo verificar si lo que quiere es borrarlo..
        if (response.wantsToDelete === true) {
          if (tags && indice >= 0) {
            tags.splice(indice, 1);
            this.currentTags.splice(indice, 1);
          }
        } else {
          // Le debo poner al tag actual el num que llega
          tag.bbox.label = response.current;
          tag.bbox.theclass = this.localmodel.tags[response.current].txt;
          // Se debe escribir en el original
          if (tags && indice >= 0) {
            tags[indice][0] = response.current;
          }
        }
        // Se marca la imagen como cambiada
        this.setChangedImage(this.currentImage);
      } else {
        this.currentLabel = response.current;
      }
      // Si cambiaron los tags vale la pena volverlos a visualizar
      if (recomputeTags) {
        this.recomputeCurrentImageTags();
      }
    }
  }

  recomputeCurrentImageTags() {
    this.currentTags = [];
    const imageHeight = this.boundingBoxBigImage.imageHeight;
    const imageWidth = this.boundingBoxBigImage.imageWidth;
    const tags = this.currentImage?.tags;
    if (tags) {
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        const label = tag[0]; // label
        const d1 = tag[1]; //x_center/width
        const d2 = tag[2]; //y_center/height
        const d3 = tag[3]; //width/image_width
        const d4 = tag[4]; //height/image_height

        let width = imageWidth * d3;
        let height = imageHeight * d4;
        let left = imageWidth * d1 - width * 0.5;
        let top = imageHeight * d2 - height * 0.5;

        this.currentTags.push({
          bbox: {
            label,
            theclass: this.getClassFromLabel(label),
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

  adjustView(): void {
    try {
      if (this.currentImage == null) {
        return;
      }
      const imageElement = this.bigImageRef.nativeElement;
      const element = this.containerPreview.nativeElement;
      if (imageElement) {
        imageElement.onload = undefined;
      }
      this.viewAdjusted = false;
      this.adjustIteration++;
      const lastIteration = this.adjustIteration;
      setTimeout(() => {
        // Check size of
        if (this.adjustIteration != lastIteration) {
          return;
        }
        if (element) {
          const rect = element.getBoundingClientRect();
          this.boundingBoxBigImage = {
            imageWidth: 0,
            imageHeight: 0,
            width: rect.width,
            height: rect.height,
            style: {
              width: Math.floor(rect.width) + 'px',
              height: Math.floor(rect.height) + 'px',
            },
            styleImage: { marginTop: '0px', marginLeft: '0px' },
            styleOverlay: {
              left: '0px',
              top: '0px',
              width: '0px',
              height: '0px',
            },
            styleBBoxNew: {
              borderColor: this.getColorFromCurrentClass(),
              display: 'none',
              left: '0px',
              top: '0px',
              width: '0px',
              height: '0px',
            },
          };
          this.viewAdjusted = true;
          setTimeout(() => {
            // Debo tomar la imágen y saber el tamaño
            const wait = this.indicatorSrv.start();
            this.showTags = false;
            const recomputeImageOverlay = () => {
              this.showTags = true;
              wait.done();
              imageElement.onload = undefined;
              //const imageRect = imageElement.getBoundingClientRect();
              const imageWidth = imageElement.clientWidth;
              const imageHeight = imageElement.clientHeight;
              this.boundingBoxBigImage.imageWidth = imageWidth;
              this.boundingBoxBigImage.imageHeight = imageHeight;
              // Calculo el marginTop
              const heightOverflow =
                this.boundingBoxBigImage.height - imageHeight;
              const styleImage = { marginTop: '0px', marginLeft: '0px' };
              const styleOverlay = {
                left: '0px',
                top: '0px',
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
              };
              let imageMarginChanges = 0;
              if (heightOverflow > 0) {
                const halfHeightOverflow = Math.floor(heightOverflow / 2);
                styleImage.marginTop = `${halfHeightOverflow}px`;
                styleOverlay.top = styleImage.marginTop;
                imageMarginChanges++;
              }
              // Calculo el marginLeft
              const widthOverflow = this.boundingBoxBigImage.width - imageWidth;
              if (widthOverflow > 0) {
                const halfWidthOverflow = Math.floor(widthOverflow / 2);
                styleImage.marginLeft = `${halfWidthOverflow}px`;
                styleOverlay.left = styleImage.marginLeft;
                imageMarginChanges++;
              }
              if (imageMarginChanges > 0) {
                this.boundingBoxBigImage.styleImage = styleImage;
                this.boundingBoxBigImage.styleOverlay = styleOverlay;
                this.recomputeCurrentImageTags();
              }
            };
            imageElement.onerror = () => {
              wait.done();
            };
            if (!imageElement.complete) {
              imageElement.onload = recomputeImageOverlay;
            } else {
              recomputeImageOverlay();
            }
          }, 0);
        }
      }, 0);
    } catch (err) {
      console.log(err);
    }
  }
}
