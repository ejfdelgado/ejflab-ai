import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, BackendPageService, BaseComponent, CallService, FileService, FlowchartService, ModalService, OptionData, TupleService, WebcamService } from 'ejflab-front-lib';

@Component({
  selector: 'app-ejflabmodule',
  templateUrl: './ejflabmodule.component.html',
  styleUrl: './ejflabmodule.component.css'
})
export class EjflabmoduleComponent extends BaseComponent implements OnInit {

  public extraOptions: Array<OptionData> = [];

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
    private router: Router,
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
      { pathname: 'llm', label: 'LLM', icon: 'psychology' },
      { pathname: 'milvus', label: 'Database', icon: 'menu_book' },
    ];
    for (let i = 0; i < VIEW_OPTIONS.length; i++) {
      const viewOption = VIEW_OPTIONS[i];
      this.extraOptions.push({
        action: () => {
          this.router.navigate([viewOption.pathname]);
        },
        icon: viewOption.icon,
        label: viewOption.label,
      });
    }
  }

  override async ngOnInit() {
    await super.ngOnInit();
    //this.socketIoConnect(this.builderConfig);
  }

  override bindEvents() {

  }
}
