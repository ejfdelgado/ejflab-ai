import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { DOCUMENT } from '@angular/common';
import { BaseComponent } from 'ejflab-front-lib';
import { ActivatedRoute } from '@angular/router';
import { BackendPageService } from 'ejflab-front-lib';
import { AuthService } from 'ejflab-front-lib';
import { MatDialog } from '@angular/material/dialog';
import { TupleService } from 'ejflab-front-lib';
import { FileService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { LoginService } from 'ejflab-front-lib';
import { HttpService } from 'ejflab-front-lib';
import { OptionData } from 'ejflab-front-lib';
import { WebcamService } from 'ejflab-front-lib';
import { GceService } from 'ejflab-front-lib';
import { FlowchartService } from 'ejflab-front-lib';
import { CallService } from 'ejflab-front-lib';

@Component({
  selector: 'app-gcp',
  templateUrl: './gcp.component.html',
  styleUrls: ['./gcp.component.css'],
})
export class GcpComponent extends BaseComponent implements OnInit, OnChanges {
  public extraOptions: Array<OptionData> = [];
  public currentView: string = 'tag';
  public mymodel: any = {};
  serverMap: { [key: string]: any };
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
    private gceSrv: GceService
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

  ngOnChanges(changes: SimpleChanges): void {}

  bindEvents() {}

  override async ngOnInit() {
    await super.ngOnInit();
    const temp = await this.gceSrv.readAll();
    this.serverMap = temp.map;
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
}
