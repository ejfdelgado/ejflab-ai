import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';

import { IdGen } from '@ejfdelgado/ejflab-common/src/IdGen';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { ModuloDatoSeguroFront } from '@ejfdelgado/ejflab-common/src/ModuloDatoSeguroFront';
import { AuthService, BackendPageService, BaseComponent, BlobOptionsData, CallService, FileSaveResponseData, FileService, FlowchartService, ImagepickerOptionsData, ModalService, TupleService, TxtOptionsData, WebcamService } from 'ejflab-front-lib';

@Component({
  selector: 'app-cv',
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.css'],
})
export class CvComponent extends BaseComponent implements OnInit, OnDestroy {
  imageOptions: ImagepickerOptionsData = {
    isEditable: true,
    isRounded: false,
    useBackground: false,
    useRoot: MyConstants.SRV_ROOT,
    autosave: true,
    defaultFileName: 'miImagen.jpg',
  };
  textOptions: TxtOptionsData = {
    height: '200px',
    maxHeight: '200px',
    useRoot: MyConstants.SRV_ROOT,
  };
  blobOptions: BlobOptionsData = {
    useRoot: MyConstants.SRV_ROOT,
    autosave: true,
  };
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

  override bindEvents() {
    //
  }

  override onTupleReadDone() {
    if (!this.tupleModel.image) {
      this.tupleModel.image = MyConstants.PAGE.NO_IMAGE;
    }
    console.log("onTupleReadDone...");
  }

  async saveTextRef(response: FileSaveResponseData) {
    this.tupleModel.txtFile = response.key;
    super.saveTuple();
  }

  async testCifer() {
    const llavePublica =
      '-----BEGIN PUBLIC KEY-----\
MDwwDQYJKoZIhvcNAQEBBQADKwAwKAIhAM+53jqSLGfawXnrz5rmRs5Beg1XfgXL\
tLAesEEBkicPAgMBAAE=\
-----END PUBLIC KEY-----\
';
    const llavePrivada =
      '-----BEGIN PRIVATE KEY-----\
MIHDAgEAMA0GCSqGSIb3DQEBAQUABIGuMIGrAgEAAiEAz7neOpIsZ9rBeevPmuZG\
zkF6DVd+Bcu0sB6wQQGSJw8CAwEAAQIgBqWK39LnitcsE6ug8/LkVwxprUbTmJGt\
helcnGpk4oECEQDxBmnsnP3xpVW2vK0ceTjBAhEA3KHSeoVNCYmawX5oraMDzwIR\
AKdwJTXS+jdc/GauPDSDogECEQC3G9pqcu1PyBNXGUlZKlzDAhASO74AOK6q8tA2\
1NMvWu5a\
-----END PRIVATE KEY-----';
    const cifrado = ModuloDatoSeguroFront.cifrar(
      { valor: 'edgar' },
      llavePublica
    );
    const decifrado = ModuloDatoSeguroFront.decifrar(cifrado, llavePrivada);
    console.log(decifrado);
  }

  async setTime() {
    if (!this.tupleModel) {
      return;
    }
    const tiempo = await IdGen.ahora();
    this.tupleModel.t = [tiempo];
    super.saveTuple();
  }

  override async ngOnInit() {
    await super.ngOnInit();
  }

  override async ngOnDestroy() {
    super.ngOnDestroy();
  }
}
